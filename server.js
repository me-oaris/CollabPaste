const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
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
  language: { type: String, default: 'plaintext' },
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
        paste = await Paste.create({ roomId, title: '', content: '', language: 'plaintext' });
      }
      socket.emit("load", {title: paste.title, content: paste.content, language: paste.language });
      emitUserCount(roomId);
    } catch (error) {
      console.error("Error occurred while fetching paste:", error);
    }
  });

  socket.on("edit", async ({ roomId, title, content, language }) => {
    try {
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (language !== undefined) updateData.language = language;
      updateData.updatedAt = Date.now();

      const UpdatedPaste = await Paste.findOneAndUpdate({ roomId }, updateData, { returnDocument: 'after' }); 
      io.to(roomId).emit("update", { title: UpdatedPaste.title, content: UpdatedPaste.content, language: UpdatedPaste.language });
    } catch (error) {
      console.error("Error occurred while updating paste:", error);
    }
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];

    rooms.forEach(roomId => {
      if (roomId !== socket.id) {
        emitUserCount(roomId);
      }
  });
});
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});