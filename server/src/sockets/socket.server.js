const { Server } = require("socket.io");
let io;

const initSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 60000,
    path: "/api/socket.io",
  });

  io.on("connection", (socket) => {
    console.log(`User connected :${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`User disconnected :${socket.id}`);
    });

    socket.on("error", (err) => {
      console.error(`Socket error: ${err.message}`, err);
    });
  });
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

module.exports = { initSocketServer, getIO };
