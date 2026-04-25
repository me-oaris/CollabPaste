const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const { error } = require('console');
const env = require('dotenv');
env.config();

const app = express();
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(error => console.error("Could not connect to MongoDB", error));

const PasteSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  title: { type: String, default: '' },
  content: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

const Paste = mongoose.model('Paste', PasteSchema);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

const emitUserCount = (roomId) => {
  const room = io.sockets.adapter.rooms.get(roomId);
  const userCount = room ? room.size : 0;
  io.to(roomId).emit("userCount", userCount);
}

io.on('connection', (socket) => {
  console.log('User Connected', socket.id);
  let currentRoom = null;

  socket.on("join", async (roomId) => {
    currentRoom = roomId;
    socket.join(roomId);

    try {
      let paste = await Paste.findOne({ roomId });
      if (!paste) {
        paste = await Paste.create({ roomId, title: '', content: '' });
      }
      socket.emit("load", {title: paste.title, content: paste.content });
      emitUserCount(roomId);
    } catch (error) {
      console.error("Error occurred while fetching paste:", error);
    }
  });

  socket.on("edit", async ({ roomId, title, content }) => {
    try {
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      updateData.updatedAt = Date.now();

      await Paste.findOneAndUpdate({ roomId }, updateData, { returnDocument: after, upsert: true });

      socket.to(roomId).emit("update", { title, content });
    } catch (error) {
      console.error("Error occurred while updating paste:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
    if (currentRoom) {
      emitUserCount(currentRoom);
    }
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});