const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

const rooms = {};

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on("join", (roomId) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = { title: '', content: '' };
    }

    socket.emit("load", rooms[roomId]);
  });

  socket.on("edit", ({ roomId, title, content }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = { title: '', content: '' };
    }

    if (title !== undefined) {
      rooms[roomId].title = title;
    }

    if (content !== undefined) {
      rooms[roomId].content = content;
    }

    socket.to(roomId).emit("update", { title, content });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});