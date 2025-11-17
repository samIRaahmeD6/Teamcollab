import Download from "../assets/download.jpeg";
import { LogOut } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import toast, { Toaster } from "react-hot-toast";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

export const Dashboard = () => {
  const storedData = JSON.parse(localStorage.getItem("user") || "{}");
  const [loggedInUser, setLoggedInUser] = useState(storedData?.user);

  const [userName, setUserName] = useState("");
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);

  const [taskText, setTaskText] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [assignedUser, setAssignedUser] = useState("");
  const [tasks, setTasks] = useState({
    todo: [],
    progress: [],
    done: [],
  });

  const userId = loggedInUser?.id;
  const messagesEndRef = useRef(null);

  // Set username
  useEffect(() => {
    if (loggedInUser?.username) setUserName(loggedInUser.username);
  }, [loggedInUser?.username]);

  // Socket connection
  useEffect(() => {
    if (!loggedInUser?.id) return;

    const newSocket = io("http://localhost:3000", {
      auth: { userId: loggedInUser.id },
      transports: ["websocket"],
    });

    newSocket.on("connect", () => console.log("✅ Socket connected:", newSocket.id));

    newSocket.on("updateUsers", (onlineUserIds) => setOnlineUsers(onlineUserIds));

    newSocket.on("newMessage", (msg) => setMessages((prev) => [...prev, msg]));

    // Admin sees all task updates
    newSocket.on("updateTaskForAdmin", (updatedTask) => {
      if (loggedInUser.role !== "admin") return;

      setTasks((prev) => {
        const newState = { ...prev };
        // Remove task from all columns
        Object.keys(newState).forEach((col) => {
          newState[col] = newState[col].filter((t) => t.id !== updatedTask.id);
        });

        // Determine column based on status
        const column =
          updatedTask.status === "pending"
            ? "todo"
            : updatedTask.status === "in_progress"
            ? "progress"
            : "done";

        newState[column] = [...newState[column], updatedTask];
        return newState;
      });
    });

    // New task listener
    newSocket.on("newTask", (task) => {
      setTasks((prev) => {
        const column =
          task.status === "pending"
            ? "todo"
            : task.status === "in_progress"
            ? "progress"
            : "done";

        if (loggedInUser.role === "admin" || task.assigned_to === loggedInUser.id) {
          return { ...prev, [column]: [...prev[column], task] };
        }
        return prev;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      console.log("🔴 Socket disconnected");
    };
  }, [loggedInUser?.id, loggedInUser.role]);

  // Fetch messages
  useEffect(() => {
    fetch("http://localhost:3000/api/messages")
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch((err) => console.error(err));
  }, []);

  // Fetch users
  useEffect(() => {
    fetch("http://localhost:3000/api/users", {
      headers: { "x-api-key": API_KEY },
    })
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error(err));
  }, []);
 
  useEffect(() => {
  if (!socket) return;

  const handleTaskUpdate = (task) => {
     toast.success(`Task "${task.title}" updated by ${task.assigned_to_name}`);
    setTasks(prev => {
      // update the task in local state
      const newState = { ...prev };
      Object.keys(newState).forEach(col => {
        newState[col] = newState[col].map(t =>
          t.id === task.id ? { ...t, status: task.status } : t
        );
      });
      return newState;
    });
  };

  socket.on("taskUpdatedByUser", handleTaskUpdate);

  return () => {
    socket.off("taskUpdatedByUser", handleTaskUpdate);
  };
}, [socket]);
  // Fetch tasks
useEffect(() => {
  if (!userId) return;

  fetch(`http://localhost:3000/api/tasks/${userId}`) // <-- pass userId
    .then((res) => res.json())
    .then((data) => {
      const tasksArray = Array.isArray(data.tasks) ? data.tasks : [];
      let filteredTasks =
        loggedInUser.role === "admin"
          ? tasksArray
          : tasksArray.filter((t) => t.assigned_to === userId);

      setTasks({
        todo: filteredTasks.filter((t) => t.status === "pending"),
        progress: filteredTasks.filter((t) => t.status === "in_progress"),
        done: filteredTasks.filter((t) => t.status === "completed"),
      });
    })
    .catch((err) => {
      console.error(err);
      setTasks({ todo: [], progress: [], done: [] });
    });
}, [userId, loggedInUser.role]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      user_id: loggedInUser.id,
      username: loggedInUser.username,
      message: newMessage,
      created_at: new Date().toISOString(),
    };

    socket.emit("sendMessage", messageData);

    try {
      await fetch("http://localhost:3000/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
        body: JSON.stringify(messageData),
      });
    } catch (err) {
      console.error(err);
    }

    setNewMessage("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogout = () => {
    if (socket && loggedInUser?.id) socket.emit("logout", loggedInUser.id);
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // Assign task
  const handleAssignTask = async () => {
    if (!taskText || !assignedUser) return alert("Enter task and select a user");

    try {
      const res = await fetch("http://localhost:3000/api/assign-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskText,
          description: taskText,
          assigned_to: assignedUser,
          priority: taskPriority,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTaskText("");
        setTaskPriority("medium");
        setAssignedUser("");
        socket.emit("taskAssigned", data.task);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Drag & Drop with DB update
  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index)
      return;

    const sourceItems = Array.from(tasks[source.droppableId]);
    const destItems = Array.from(tasks[destination.droppableId]);
    const [movedTask] = sourceItems.splice(source.index, 1);
    destItems.splice(destination.index, 0, movedTask);

    const newTasksState = {
      ...tasks,
      [source.droppableId]: sourceItems,
      [destination.droppableId]: destItems,
    };

    setTasks(newTasksState);

    // Determine new status
    const newStatus =
      destination.droppableId === "todo"
        ? "pending"
        : destination.droppableId === "progress"
        ? "in_progress"
        : "completed";

    try {
      // Update task in backend
      console.log("PUT taskId:", movedTask.id, "to status:", newStatus);
      const res = await fetch(`http://localhost:3000/api/tasks/${movedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success && socket) {
        // Notify admins
        socket.emit("taskUpdated", data.task);
      }
    } catch (err) {
      console.error("❌ Failed to update task:", err);
    }
  };
  

  return (
    
    <div className="h-screen w-screen bg-[linear-gradient(to_right,#ae6d4c,#7a4b49,#8b5559)]">
      {/* Navbar */}

    <Toaster position="top-right" className="bg-[#976773]" reverseOrder={false} />
    {/* rest of your dashboard JSX */}
  
      <nav className="bg-gray-100 h-20 shadow-md flex justify-between items-center px-6">
        <h1 className="text-[#976773] text-2xl font-extrabold">TeamCollab</h1>
        <div className="flex flex-col items-end">
          <div className="flex items-center">
            <img className="h-8 w-8 rounded-full" src={Download} alt="" />
            <h1 className="px-2 text-[#976773]">{userName}</h1>
          </div>
          <button
            className="flex items-center gap-2 pr-2 text-[#976773] hover:text-red-500 mt-1"
            onClick={handleLogout}
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex flex-col h-[calc(100vh-5rem)]">
        <div className="flex flex-1">
          {/* Sidebar */}
          <div className="w-[25%] p-6 flex flex-col gap-6 h-[calc(100vh-5rem)]">
            {/* Users */}
            <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-2xl p-4 shadow-lg flex flex-col h-48">
              <h1 className="text-white font-bold text-xl mb-4 border-b border-white/40 pb-2">Users</h1>
              <div className="flex-1 space-y-3 overflow-y-auto scrollbar-hide">
                {users.map((user) => {
                  const isOnline = onlineUsers.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-lg cursor-pointer transition relative"
                    >
                      <div className="relative">
                        <img className="h-8 w-8 rounded-full" src={Download} alt={user.username} />
                        <span
                          className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border border-white ${
                            isOnline ? "bg-green-500" : "bg-red-500"
                          }`}
                        ></span>
                      </div>
                      <h1 className="text-gray-100">{user.username}</h1>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chat */}
            <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-2xl p-4 shadow-lg flex flex-col h-96">
              <h1 className="text-white font-bold text-xl mb-4 border-b border-white/40 pb-2">Chats</h1>
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto scrollbar-hide">
                {messages.map((msg, index) => (
                  <div key={index}>
                    {msg.user_id === loggedInUser.id ? (
                      <div className="flex flex-col items-end">
                        <div className="flex flex-row justify-end pb-1">
                          <h1 className="px-3 text-sm text-gray-100">You</h1>
                          <img className="h-4 w-4 rounded-full" src={Download} alt="" />
                        </div>
                        <div className="flex justify-center mr-6 bg-white h-auto max-w-xs px-3 py-2 shadow-md rounded-md">
                          <p>{msg.message}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex flex-row items-center">
                          <img className="h-4 w-4 rounded-full" src={Download} alt="" />
                          <h1 className="px-3 text-sm text-gray-100">{msg.username || "Unknown"}</h1>
                        </div>
                        <div className="bg-white px-3 py-2 shadow-md rounded-md inline-block max-w-xs ml-6">
                          <p>{msg.message}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="mt-4 shrink-0 flex justify-center items-center gap-3">
                <input
                  type="text"
                  placeholder="Type..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="w-2/3 p-3 rounded-xl border border-white/30 bg-white/30 text-white placeholder-gray-200 outline-none focus:ring-2 focus:ring-white/50"
                />
                <button
                  onClick={handleSend}
                  className="bg-white text-[#7a4b49] h-12 px-6 rounded-xl shadow-md hover:bg-gray-100 transition"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Task Board */}
          <div className="flex-1 flex flex-col p-6 justify-between">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex gap-6 justify-center">
                {["todo", "progress", "done"].map((column) => (
                  <Droppable key={column} droppableId={column}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="w-[28%] backdrop-blur-lg bg-white/20 border border-white/30 rounded-2xl p-4 shadow-lg"
                      >
                        <h1 className="text-white font-bold text-xl mb-4 border-b border-white/40 pb-2">
                          {column === "todo"
                            ? "To Do"
                            : column === "progress"
                            ? "In Progress"
                            : "Completed"}
                        </h1>
                        {tasks[column].map((task, index) => (
  <Draggable
    key={task.id}
    draggableId={String(task.id)}
    index={index}
    isDragDisabled={loggedInUser.role === "admin"} // <-- disable drag for admin
  >
    {(provided) => (
      <div
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        ref={provided.innerRef}
        className="bg-white/80 rounded-lg shadow p-3 text-[#7a4b49] hover:bg-white transition mb-3"
      >
        <div className="flex items-center justify-between">
          <span>{task.title}</span>
          {loggedInUser.role === "admin" && (
          <p className="text-[10px] text-gray-500">
            {task.assigned_to_name || "Unknown"}
          </p>
        )}
        </div>
      </div>
    )}
  </Draggable>
))}

                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>

            {/* Task Assignment Section (Admin Only) */}
            {loggedInUser.role === "admin" && (
              <div className="mt-6 flex justify-center items-center gap-3">
                <input
                  type="text"
                  placeholder="Type your task..."
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  className="w-2/5 p-3 rounded-xl border border-white/30 bg-white/30 text-white placeholder-gray-200 outline-none focus:ring-2 focus:ring-white/50"
                />
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="w-40 p-3 rounded-xl border border-white/30 bg-white/30 text-white outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="low" className="text-white bg-[#7a4b49]">Low</option>
                  <option value="medium" className="text-white bg-[#7a4b49]">Medium</option>
                  <option value="high" className="text-white bg-[#7a4b49]">High</option>
                </select>
                <select
                  value={assignedUser}
                  onChange={(e) => setAssignedUser(e.target.value)}
                  className="w-40 p-3 rounded-xl border border-white/30 bg-white/30 text-white outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id} className="text-white bg-[#7a4b49]">{user.username}</option>
                  ))}
                </select>
                <button
                  onClick={handleAssignTask}
                  className="bg-white text-[#7a4b49] h-12 px-6 py-2 rounded-xl shadow-md hover:bg-gray-100 transition"
                >
                  Assign
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
