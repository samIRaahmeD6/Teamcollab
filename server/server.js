const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes.js");

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://hasibul-rupok.com"
];

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// ---- CUSTOM CORS ----
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,x-api-key");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ---- FIXED: Preflight (OPTIONS) ----
app.options(/.*/, (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// ---- SOCKET.IO ----
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  }
});

// Attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ---- ROUTES ----
app.use("/api", userRoutes);

// Test route
app.get("/", (req, res) => res.send("✔ TeamCollab backend running..."));

// ---- SOCKET.IO HANDLERS ----
let onlineUsers = new Map();

io.on("connection", (socket) => {
  const userId = Number(socket.handshake.auth?.userId);
  if (!userId) return socket.disconnect(true);

  onlineUsers.set(userId, socket.id);
  io.emit("updateUsers", Array.from(onlineUsers.keys()));

  socket.on("logout", (id) => {
    onlineUsers.delete(Number(id));
    io.emit("updateUsers", Array.from(onlineUsers.keys()));
    socket.disconnect(true);
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(userId);
    io.emit("updateUsers", Array.from(onlineUsers.keys()));
  });
});

// ---- START SERVER ----
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
