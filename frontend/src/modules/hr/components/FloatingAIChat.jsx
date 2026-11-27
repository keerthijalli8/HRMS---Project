import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from './Icon.jsx';
import { askGeminiHR } from '../services/geminiService.js';

// Attendance Data strictly for CSV Download
const TEAM_ATTENDANCE_DATA = {
  "Engineering": [
    { id: "NEX-101", name: "Aarav Sharma", role: "Frontend Lead", status: "Present", checkIn: "09:15 AM", regularization: "Approved" },
    { id: "NEX-102", name: "Pooja Patel", role: "Full Stack Dev", status: "Present", checkIn: "09:22 AM", regularization: "Pending" },
    { id: "NEX-103", name: "Rohan Verma", role: "Backend Dev", status: "On Leave", checkIn: "-", regularization: "N/A" }
  ],
  "Product & Design": [
    { id: "NEX-201", name: "Ananya Nair", role: "Product Manager", status: "Present", checkIn: "09:30 AM", regularization: "Approved" },
    { id: "NEX-202", name: "Vikram Rao", role: "UI/UX Designer", status: "Present", checkIn: "09:40 AM", regularization: "Approved" }
  ],
  "HR & Operations": [
    { id: "NEX-301", name: "Kavita Desai", role: "HR Manager", status: "Present", checkIn: "09:00 AM", regularization: "Approved" },
    { id: "NEX-302", name: "Siddharth Menon", role: "HR Executive", status: "Present", checkIn: "09:18 AM", regularization: "Pending" }
  ],
  "My Monthly Attendance": [
    { date: "2026-11-01", checkIn: "09:15 AM", checkOut: "06:30 PM", status: "Present", regularization: "Approved" },
    { date: "2026-11-02", checkIn: "09:10 AM", checkOut: "06:20 PM", status: "Present", regularization: "Approved" },
    { date: "2026-11-03", checkIn: "Missing", checkOut: "Missing", status: "Absent / Missing Punch", regularization: "Pending Request" }
  ]
};

const ONE_HOUR_MS = 60 * 60 * 1000;

export function FloatingAIChat({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const getInitialMessages = () => [
    { 
      sender: 'ai', 
      text: `Hello ${currentUser?.name || 'Employee'}! I am Nexora AI powered by Gemini. Ask or speak anything about HR policies, leave, payroll, or attendance!` 
    }
  ];

  const storageKey = `nexora_ai_chat_${currentUser?.employeeId || 'guest'}`;

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.timestamp && (Date.now() - parsed.timestamp < ONE_HOUR_MS) && Array.isArray(parsed.messages)) {
          return parsed.messages;
        }
        localStorage.removeItem(storageKey);
      }
    } catch (e) {}
    return getInitialMessages();
  });

  const [input, setInput] = useState('');

  // Text-to-Speech (AI Voice Reply)
  const speakText = useCallback((text) => {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/[*#_`~]/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-IN';
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  }, [isVoiceEnabled]);

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Real Gemini AI + Attendance CSV Routing
  const processUserQuery = useCallback(async (userText) => {
    if (!userText.trim()) return;

    const query = userText.toLowerCase().trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);

    // If user asks specifically for attendance CSV download options
    if (query.includes('attendance report') || query.includes('download attendance') || query.includes('team attendance')) {
      const reply = "📅 **Attendance Reports:** Select a department below to download its attendance CSV report:";
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: reply, options: Object.keys(TEAM_ATTENDANCE_DATA) }
      ]);
      speakText(reply);
      return;
    }

    // Call Real Gemini AI for all queries
    setIsThinking(true);
    const contextPrompt = `User Name: ${currentUser?.name || 'Employee'}, Role: ${currentUser?.role || 'Staff'}. User Question: ${userText}`;
    const aiReply = await askGeminiHR(contextPrompt);
    setIsThinking(false);

    setMessages(prev => [...prev, { sender: 'ai', text: aiReply }]);
    speakText(aiReply);
  }, [currentUser?.name, currentUser?.role, speakText]);

  // Setup Browser Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);

      if (event.results[0].isFinal) {
        setInput('');
        processUserQuery(transcript);
      }
    };

    recognitionRef.current = recognition;
  }, [processUserQuery]);

  // Toggle Microphone (Start / Cancel)
  const handleToggleMic = (e) => {
    e.stopPropagation();
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      stopSpeaking();
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Mic start error:", err);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (chatContainerRef.current && !chatContainerRef.current.contains(e.target)) {
        setIsOpen(false);
        stopSpeaking();
        if (isListening && recognitionRef.current) recognitionRef.current.stop();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, isListening]);

  useEffect(() => {
    try {
      if (messages.length > 1) {
        const existingRaw = localStorage.getItem(storageKey);
        let sessionStart = Date.now();
        if (existingRaw) {
          const existing = JSON.parse(existingRaw);
          if (existing.timestamp && (Date.now() - existing.timestamp < ONE_HOUR_MS)) {
            sessionStart = existing.timestamp;
          }
        }
        localStorage.setItem(storageKey, JSON.stringify({ timestamp: sessionStart, messages }));
      }
    } catch (e) {}
  }, [messages, storageKey]);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, isOpen]);

  const handleOpenChat = (e) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  const handleNewChat = (e) => {
    e.stopPropagation();
    stopSpeaking();
    if (isListening && recognitionRef.current) recognitionRef.current.stop();
    localStorage.removeItem(storageKey);
    setMessages(getInitialMessages());
  };

  const downloadAttendanceCSV = (key) => {
    const records = TEAM_ATTENDANCE_DATA[key] || [];
    if (records.length === 0) return;

    const headers = Object.keys(records[0]).map(h => h.toUpperCase());
    const rows = records.map(row => Object.values(row).map(val => `"${val}"`).join(","));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${key.replace(/[^a-zA-Z0-9]/g, '_')}_Attendance_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAttendanceSelect = (e, optionKey) => {
    e.stopPropagation();
    downloadAttendanceCSV(optionKey);
    const replyText = `Here is the attendance summary for **${optionKey}**. Your CSV report has been downloaded!`;
    setMessages(prev => [
      ...prev,
      { sender: 'user', text: `Selected: ${optionKey}` },
      { sender: 'ai', text: replyText, downloadableAttendance: optionKey }
    ]);
    speakText(replyText);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!input.trim() || isThinking) return;

    const userText = input;
    setInput('');
    processUserQuery(userText);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {!isOpen && (
        <button
          type="button"
          onClick={handleOpenChat}
          className="bg-accent text-on-accent p-4 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-all duration-200 border border-line cursor-pointer"
          title="HRMS AI Assistant"
        >
          <Icon name="message-square" className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div 
          ref={chatContainerRef}
          onClick={(e) => e.stopPropagation()} 
          className="bg-white text-gray-800 border border-gray-200 rounded-2xl shadow-2xl w-80 md:w-96 flex flex-col h-[520px] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-accent text-on-accent p-4 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
              <Icon name="message-square" className="w-5 h-5" />
              <div>
                <span className="font-semibold text-sm block leading-tight">Nexora AI Assistant</span>
                <span className="text-[10px] opacity-80 block">
                  {isListening ? "🎙️ Listening... (Click Stop to Cancel)" : "Gemini AI + Voice Active"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isVoiceEnabled) stopSpeaking();
                  setIsVoiceEnabled(!isVoiceEnabled);
                }}
                className="text-on-accent/90 hover:text-on-accent bg-black/10 hover:bg-black/20 p-1.5 rounded-md transition cursor-pointer"
                title={isVoiceEnabled ? "Mute AI Voice" : "Unmute AI Voice"}
              >
                <Icon name={isVoiceEnabled ? "volume-2" : "volume-x"} className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleNewChat}
                className="text-on-accent/90 hover:text-on-accent text-[11px] bg-black/10 hover:bg-black/20 px-2 py-1 rounded-md transition cursor-pointer"
                title="Start New Chat"
              >
                New Chat
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  stopSpeaking();
                  if (isListening && recognitionRef.current) recognitionRef.current.stop();
                  setIsOpen(false);
                }}
                className="text-on-accent hover:opacity-80 text-lg font-bold px-1.5 cursor-pointer"
                title="Minimize"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
          >
            {messages.map((msg, index) => (
              <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-xl text-xs shadow-sm leading-relaxed whitespace-pre-line ${msg.sender === 'user' ? 'bg-accent text-on-accent rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>
                  {msg.text}
                </div>

                {msg.options && msg.options.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                    {msg.options.map((opt, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={(e) => handleAttendanceSelect(e, opt)}
                        className="bg-accent/10 hover:bg-accent hover:text-on-accent text-accent border border-accent/30 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition text-left cursor-pointer"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {msg.downloadableAttendance && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadAttendanceCSV(msg.downloadableAttendance);
                    }}
                    className="mt-2 ml-1 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow-sm transition cursor-pointer"
                  >
                    <Icon name="download" className="w-3.5 h-3.5" />
                    Download {msg.downloadableAttendance} CSV
                  </button>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="flex items-start">
                <div className="bg-white text-gray-500 border border-gray-200 p-3 rounded-xl rounded-bl-none text-xs shadow-sm animate-pulse">
                  Nexora AI is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box with Voice Mic */}
          <form 
            onSubmit={handleSendMessage} 
            onClick={(e) => e.stopPropagation()}
            className="p-3 bg-white border-t border-gray-200 flex items-center gap-1.5"
          >
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder={isListening ? "🎙️ Listening... Speak now" : "Ask or speak anything..."}
              className="flex-1 bg-gray-100 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-accent"
            />
            
            <button
              type="button"
              onClick={handleToggleMic}
              title={isListening ? "Click to Cancel / Stop" : "Speak Query"}
              className={`p-2 rounded-xl border transition cursor-pointer shrink-0 text-sm flex items-center justify-center ${
                isListening
                  ? "bg-red-500 text-white border-red-600 animate-pulse"
                  : "bg-gray-100 text-gray-700 border-gray-300 hover:text-accent hover:border-accent"
              }`}
            >
              {isListening ? "⏹️" : "🎙️"}
            </button>

            <button 
              type="submit" 
              disabled={isThinking}
              className="bg-accent text-on-accent px-3.5 py-2 rounded-xl text-xs font-semibold hover:brightness-105 transition cursor-pointer shrink-0 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}