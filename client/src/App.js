import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import logo from './collabpaste.png'; 
import { createHighlighter } from 'shiki';
import './App.css';

function App() {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const roomId = window.location.pathname.split('/')[1];
  const typingTimeout = useRef(null);
  const [isCopied, setIsCopied] = useState(false);
  const [userCount, setUserCount] = useState(0);

  const [highlightedCode, setHighlightedCode] = useState('');
  const [isHighlighterReady, setIsHighlighterReady] = useState(false);
  const [language, setLanguage] = useState('plaintext');
  const highlighterRef =  useRef(null);
  const highlightRef = useRef(null);

  const socketRef = useRef(null);

  useEffect(() => {
    const initHighLighter = async () => {
      highlighterRef.current = await createHighlighter({
        themes: ['github-dark'],
        langs: ['javascript', 'python', 'java', 'csharp', 'cpp', 'ruby', 'go', 'php', 'typescript', 'plaintext']
      });
      setIsHighlighterReady(true);
    };
    initHighLighter();
  }, []);



  const runHighlight = (code, lang) => {
    if (!highlighterRef.current) return;

    if(!code) {
      setHighlightedCode('');
      return;
    }

    const html = highlighterRef.current.codeToHtml(code, { lang: lang, theme: 'github-dark' });
    setHighlightedCode(html);
  };

  useEffect(() => {
    if (highlighterRef.current && isHighlighterReady) {
      runHighlight(text, language);
    }
  }, [text, language, isHighlighterReady]);

  const handleNewPaste = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    window.location.href = `/${newId}`; 
  };

  useEffect(() => {
    if (!roomId || roomId.trim() === "") {
      const newRoomId = Math.random().toString(36).substring(2, 9);
      window.location.assign(`/${newRoomId}`);
    }
  }, [roomId]);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    socketRef.current = socket;
    if (!socketRef.current) return;

    socket.on("connect", () => {
      socket.emit("join", roomId);
    });

    socket.on("userCount", setUserCount);
    
    socket.on("load", ({ title, content, language }) => {
      setTitle(title || '');
      setText(content || '');
      setLanguage(language || 'plaintext');
    });

    socket.on("update", ({ title, content, language }) => {
      if (title !== undefined) setTitle(title);
      if (content !== undefined) setText(content);
      if (language !== undefined) setLanguage(language);  
    });

    return () => {
      socket.off("connect");
      socket.off("userCount");
      socket.off("load");
      socket.off("update");
    };
  }, [roomId]);

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit("edit", { roomId, content: value });
    }, 300);
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTitle(value);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit("edit", { roomId, title: value });
    }, 300);
  };

  const handleLanguageChange = (e) => {
    const value = e.target.value;
    setLanguage(value);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit("edit", { roomId, language: value });
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
        <div className="flex justify-between items-end mb-2">
  <button 
    onClick={handleNewPaste}
    style={{ hover: { background: 'linear-gradient(to bottom, #ffffff 0%, #1976d2 100%)' } }}
    className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 transition-colors"
  >
    + Create New Paste
  </button>
  <div className="flex items-center gap-2 px-3  py-1 rounded-full bg-[#161b22] border-gray-800">
  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{userCount} {userCount === 1 ? "User" : "Users"}</span>
</div>
</div>
        <input
          className="w-full text-4xl font-bold bg-transparent border-b-2 border-gray-800 mb-8 pb-2 focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-700 text-white"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled Paste"
        />

        <div className="flex justify-between items-center mb-4">
            <select
              value={language}
              onChange={handleLanguageChange}
              className="bg-[#161b22] text-gray-500 text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option className="bg-[#0d1117] text-white" value="plaintext">Plain Text</option>
              <option className="bg-[#0d1117] text-white" value="javascript">JavaScript</option>
              <option className="bg-[#0d1117] text-white" value="python">Python</option>
              <option className="bg-[#0d1117] text-white" value="java">Java</option>
              <option className="bg-[#0d1117] text-white" value="csharp">C#</option>
              <option className="bg-[#0d1117] text-white" value="cpp">C++</option>
              <option className="bg-[#0d1117] text-white" value="ruby">Ruby</option>
              <option className="bg-[#0d1117] text-white" value="go">Go</option>
              <option className="bg-[#0d1117] text-white" value="php">PHP</option>
              <option className="bg-[#0d1117] text-white" value="typescript">TypeScript</option>
            </select>    
          </div>

        <div className="relative w-full h-[550px] font-mono text-lg rounded-2xl border-2 border-gray-800 bg-[#161b22] overflow-hidden focus-within:border-blue-500/50 transition-colors duration-200">
          <div 
            ref={highlightRef}
            className="absolute inset-0 p-8 pointer-events-none overflow-auto whitespace-pre"
            dangerouslySetInnerHTML={{ __html: highlightedCode}}
            aria-hidden="true"
          />

          <textarea
            className="absolute inset-0 w-full h-full p-8 bg-transparent text-transparent caret-blue-400 resize-none outline-none whitespace-pre overflow-auto scrollbar-none"
            value={text}
            onChange={handleTextChange}
            spellCheck="false"
            onScroll={(e) => {
              if (highlightRef.current) {
                highlightRef.current.scrollTop = e.target.scrollTop;
                highlightRef.current.scrollLeft = e.target.scrollLeft;
              }
            }}
          />  
        </div>

        <div className="mt-8 p-5 rounded-2xl flex items-center justify-between border border-gray-800 bg-[#161b22]/50">
          <div className="flex-1 min-w-0 mr-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Collaboration Link</p>
            <p className="font-mono text-sm truncate" style={{ background: "linear-gradient(to bottom, #ffffff 0%, #1976d2 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {window.location.href}
            </p>
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
            }}
            style={{
              background: "linear-gradient(to bottom, #ffffff 0%, #1976d2 100%)"
            }}
            className="text-[#0d1117] text-[16px] font-bold py-3 px-6 rounded-xl transition-all active:scale-95 shadow-blue-980/20" 
          >
           {isCopied ? "COPIED!" : "COPY"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;