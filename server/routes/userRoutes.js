// routes/userRoutes.js
const express = require("express");
const db = require("../db.js");

const router = express.Router();
// ======================
// 🔐 API Key Middleware
// ======================
const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.header("x-api-key");
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized access" });
  }
  next();
};

// ======================
// 🧍 Register New User
// ======================
router.post("/register", (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (result.length > 0)
      return res.status(409).json({ message: "Email already exists" });

    const sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)";
    db.query(sql, [username, email, password, role || "member"], (err, result) => {
      if (err) return res.status(500).json({ message: "Insert error" });
      res
        .status(201)
        .json({ message: "User registered successfully", userId: result.insertId });
    });
  });
});

// ======================
// 🔑 Login
// ======================
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  db.query(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (result.length === 0)
        return res.status(401).json({ message: "Invalid email or password" });

      const user = result[0];
      res.status(200).json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    }
  );
});

// ======================
// 👥 Fetch All Users (admin only)
// ======================
router.get("/users", apiKeyMiddleware, (req, res) => {
  db.query("SELECT id, username, email, role, status FROM users", (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.status(200).json(result);
  });
});

// ======================
// 💬 Fetch All Messages
// ======================
router.get("/messages", async (req, res) => {
  try {
    const [rows] = await db.promise().execute(`
      SELECT m.id, m.user_id, m.message, m.created_at, u.username
      FROM messages m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.created_at ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// ======================
// 📨 Post a New Message
// ======================
router.post("/messages", async (req, res) => {
  const { user_id, message } = req.body;

  if (!user_id || !message) {
    return res.status(400).json({ error: "Missing user_id or message" });
  }

  try {
    // Insert into DB
    const [result] = await db.promise().execute(
      "INSERT INTO messages (user_id, message, created_at) VALUES (?, ?, NOW())",
      [user_id, message]
    );

    // Get username
    const [userRows] = await db.promise().execute(
      "SELECT username FROM users WHERE id = ?",
      [user_id]
    );
    const username = userRows[0]?.username || "Unknown";

    // Create the message object
    const newMessage = {
      id: result.insertId,
      user_id,
      username,
      message,
      created_at: new Date(),
    };

    // Emit via Socket.IO
    if (req.io) req.io.emit("newMessage", newMessage);

    // Send response to API caller
    res.status(201).json(newMessage);

  } catch (err) {
    console.error("❌ Error inserting message:", err);
    res.status(500).json({ error: "Failed to insert message" });
  }
});


// ======================
// 📋 Fetch Tasks by User ID
// ======================
router.get("/tasks/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Get user role
    const [userRows] = await db.promise().execute(
      "SELECT id, role FROM users WHERE id = ?",
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = userRows[0];
    let tasksQuery = "";
    let queryParams = [];

    if (user.role === "admin") {
      tasksQuery = `
        SELECT t.*, u.username AS assigned_to_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        ORDER BY t.created_at DESC
      `;
    } else {
      tasksQuery = `
        SELECT t.*, u.username AS assigned_to_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.assigned_to = ?
        ORDER BY t.created_at DESC
      `;
      queryParams = [userId];
    }

    const [taskRows] = await db.promise().execute(tasksQuery, queryParams);

    res.json({ success: true, tasks: taskRows });
  } catch (err) {
    console.error("❌ Error fetching tasks:", err);
    res.status(500).json({ success: false, message: "Failed to fetch tasks" });
  }
});

// =======================
// 🚀 Assign Task
// =======================
router.post("/assign-task", async (req, res) => {
  const { title, description, assigned_to, priority } = req.body;

  if (!title || !assigned_to) {
    return res.status(400).json({
      success: false,
      message: "Title and assigned_to are required",
    });
  }

  try {
    const [result] = await db.promise().execute(
      "INSERT INTO tasks (title, description, assigned_to, status, priority, created_at, updated_at) VALUES (?, ?, ?, 'pending', ?, NOW(), NOW())",
      [title, description, assigned_to, priority]
    );

    const [userRows] = await db.promise().execute(
      "SELECT username FROM users WHERE id = ?",
      [assigned_to]
    );
    const username = userRows[0]?.username || "Unknown";

    const newTask = {
      id: result.insertId,
      title,
      description,
      priority,
      assigned_to,
      assigned_to_name: username,
      status: "pending",
      created_at: new Date(),
    };

    // Emit to all admins
    if (req.io) req.io.emit("newTask", newTask);

    // Emit directly to assigned user (if online)
    if (req.io && onlineUsers.has(Number(assigned_to))) {
      const socketId = onlineUsers.get(Number(assigned_to));
      req.io.to(socketId).emit("newTask", newTask);
    }

    res.status(201).json({
      success: true,
      message: "Task assigned successfully",
      task: newTask,
    });
  } catch (err) {
    console.error("❌ Error assigning task:", err);
    res.status(500).json({ success: false, message: "Server error while assigning task" });
  }
});

// =======================
// 🔄 Update Task Status
// =======================
router.put("/tasks/:taskId", async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ message: "Status is required" });

  try {
    // Update the task in the database
    await db.promise().execute(
      "UPDATE tasks SET status = ?, updated_at = NOW() WHERE id = ?",
      [status, taskId]
    );

    // Fetch the updated task details, including the assigned user's name
    const [rows] = await db.promise().execute(
      `SELECT t.*, u.username AS assigned_to_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.id = ?`,
      [taskId]
    );

    const updatedTask = rows[0];

    // Emit real-time update specifically for admins
    if (req.io) {
      req.io.emit("taskUpdatedByUser", {
        id: updatedTask.id,
        title: updatedTask.title,
        status: updatedTask.status,
        assigned_to_name: updatedTask.assigned_to_name,
      });
    }

    res.json({ success: true, message: "Task updated successfully", task: updatedTask });
  } catch (err) {
    console.error("❌ Error updating task:", err);
    res.status(500).json({ success: false, message: "Failed to update task" });
  }
});


module.exports = router;