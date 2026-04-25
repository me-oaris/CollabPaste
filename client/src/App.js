import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import logo from './collabpaste.png'; 

const socket = io('http://localhost:5000');

function App() {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const roomId = window.location.pathname;
  const typingTimeout = useRef(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    socket.emit("join", roomId);
    socket.on("load", ({ title, content }) => {
      setTitle(title || '');
      setText(content || '');
    });
    socket.on("update", ({ title, content }) => {
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
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-roberto transition-colors duration-300">
      <div className="max-w-3xl mx-auto pt-10 p-4">
<div className="flex items-center gap-4 mb-12">
  <img src={logo} alt="CollabPaste Logo" className="w-14 h-14 object-contain" />
  
  <h1 className="text-5xl font-black tracking-wide leading-none flex items-center">
    <span className="text-white">Collab</span>
    <span 
      className="ml-2"
      style={{
        background: 'linear-gradient(to bottom, #ffffff 0%, #1976d2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'inline-block'
      }}
    >
      Paste
    </span>
  </h1>
</div>

        <input
          className="w-full text-4xl font-bold bg-transparent border-b-2 border-gray-800 mb-8 pb-2 focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-700 text-white"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled Paste"
        />

        <textarea
          className="w-full h-[550px] p-8 text-lg font-mono rounded-2xl border-2 border-gray-800 bg-[#161b22] text-[#e6edf3] resize-none focus:outline-none focus:border-blue-500/50 shadow-2xl transition-all"
          value={text}
          onChange={handleTextChange}
          placeholder="Start typing or paste your code here..."
        />

        <div className="mt-8 p-5 rounded-2xl flex items-center justify-between border border-gray-800 bg-[#161b22]/50">
          <div className="flex-1 min-w-0 mr-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Collaboration Link</p>
            <p className="font-mono text-sm text-blue-400 truncate">{window.location.href}</p>
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              const btn = document.getElementById('copy-btn');
              btn.innerText = "COPIED!";
              setTimeout(() => btn.innerText = "COPY", 2000);
            }}
            id="copy-btn"
            className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black py-3 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/20"
          >
            COPY
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;