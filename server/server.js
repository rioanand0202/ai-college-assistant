require("dotenv").config();
const http = require("http");

const app = require("./app");
const connectMongoDB = require("./src/config/db");

const { initSocketServer } = require("./src/sockets/socket.server");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocketServer(server);

connectMongoDB();

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
