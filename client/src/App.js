import React, { useState, useEffect, useRef} from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

function App() {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const roomId = window.location.pathname;
  const typingTimeout = useRef(null);


  useEffect(() => {
    socket.emit("join", roomId);
    
    socket.on("load", ({title, content}) => {
      setTitle(title || '');
      setText(content || '');
    });
    
    socket.on("update", ({title, content}) => {
      if (title !== undefined) setTitle(title);
      if (content !== undefined) setText(content);
    });
    
    return () => {
      socket.off("load");
      socket.off("update");
    }
  }, [roomId]);
  
  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
    socket.emit("edit", { roomId, content: value });
    }, 500);
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTitle(value);

    clearTimeout(typingTimeout.current);
    
    typingTimeout.current = setTimeout(() => {
    socket.emit("edit", { roomId, title: value });
    }, 300);
  };
  
  return (
    <div className="max-w-3xl mx-auto mt-10 font-sans p-4">
      <h1 className="text-3xl font-bold text-center mb-6">CollabPaste</h1>

      <input
        className="w-full text-2xl font-semibold border border-gray-300 rounded-md p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={title}
        onChange={handleTitleChange}
        placeholder="Document Title"
      />

      <textarea
        className="w-full h-[400px] border border-gray-300 rounded-md p-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={text}
        onChange={handleTextChange}
        placeholder="Start typing..."
      />

      <div className="mt-3 text-sm text-gray-500">
        Share this URL to collaborate:{" "}
        <span className="text-blue-600">{window.location.href}</span>
      </div>

    </div>
  );
}

export default App; 