import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// PATIENT VOICE ASSISTANT - GEMINI POWERED
// ============================================================================
// Isolated emergency voice assistant for injured patients
// Uses: Google Gemini Pro + Web Speech API
// DO NOT modify existing drone/command logic
// ============================================================================

const PatientVoiceAssistant = () => {
  // ========== STATE MANAGEMENT ==========
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [micPermission, setMicPermission] = useState(null);

  // ========== REFS ==========
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // ========== BACKEND CONFIGURATION ==========
  const BACKEND_URL = '/patient/voice-assistant'; // Backend endpoint

  // ========== INITIALIZE SPEECH RECOGNITION ==========
  useEffect(() => {
    // Check for Speech Recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Voice recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    // Initialize recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Voice recognition started');
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(interimTranscript);

      if (finalTranscript) {
        handleUserMessage(finalTranscript.trim());
        setTranscript('');
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access to continue.');
        setMicPermission('denied');
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else {
        setError(`Voice recognition error: ${event.error}`);
      }
      
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('Voice recognition ended');
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    // Send initial greeting
    setTimeout(() => {
      sendInitialGreeting();
    }, 1000);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // ========== AUTO-SCROLL CHAT ==========
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ========== SEND INITIAL GREETING ==========
  const sendInitialGreeting = async () => {
    const greeting = "Hello, I'm PranAir's emergency assistant. Help is already on the way. I'm here to stay with you until they arrive. Can you tell me your name?";
    
    const aiMessage = {
      id: Date.now(),
      type: 'ai',
      text: greeting,
      timestamp: new Date()
    };

    setMessages([aiMessage]);
    speakText(greeting);
  };

  // ========== TOGGLE MIC ==========
  const toggleMicrophone = () => {
    if (!recognitionRef.current) {
      setError('Voice recognition not available');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setError(null);
      } catch (err) {
        console.error('Failed to start recognition:', err);
        setError('Failed to start microphone. Please try again.');
      }
    }
  };

  // ========== HANDLE USER MESSAGE ==========
  const handleUserMessage = async (text) => {
    if (!text.trim()) return;

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Stop listening while processing
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    // Get AI response
    await getGeminiResponse(text);
  };

  // ========== CALL BACKEND API ==========
  const getGeminiResponse = async (userInput) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Prepare FormData for multipart request
      const formData = new FormData();
      
      // Create a dummy audio file (since we're using Web Speech API, not actual audio)
      const dummyBlob = new Blob([''], { type: 'audio/wav' });
      formData.append('file', dummyBlob, 'dummy.wav');
      formData.append('user_text', userInput);
      formData.append('vitals', JSON.stringify({ note: 'No vitals sensor connected' }));
      formData.append('blip_context', 'Patient using voice interface');

      // Call backend endpoint
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Backend error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.text) {
        throw new Error('Invalid backend response format');
      }

      const aiResponseText = data.text;

      // Add AI message to chat
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: aiResponseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Play the Base64 encoded audio from backend
      if (data.audio) {
        playBase64Audio(data.audio);
      } else {
        // Fallback to browser TTS if no audio
        speakText(aiResponseText);
      }

    } catch (err) {
      console.error('Backend API error:', err);
      setError(`Connection issue: ${err.message || 'Please try speaking again.'}`);
      
      // Fallback response
      const fallbackMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: "I'm here with you. Help is on the way. Can you tell me more about how you're feeling?",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      speakText(fallbackMessage.text);
    } finally {
      setIsProcessing(false);
    }
  };

  // ========== PLAY BASE64 AUDIO ==========
  const playBase64Audio = (base64Audio) => {
    try {
      setIsSpeaking(true);
      
      // Create audio element from Base64 string
      const audioSrc = `data:audio/mp3;base64,${base64Audio}`;
      const audio = new Audio(audioSrc);
      
      audio.onended = () => {
        setIsSpeaking(false);
      };
      
      audio.onerror = (err) => {
        console.error('Audio playback error:', err);
        setIsSpeaking(false);
      };
      
      // Play the audio
      audio.play().catch(err => {
        console.error('Failed to play audio:', err);
        setIsSpeaking(false);
      });
    } catch (err) {
      console.error('Error processing audio:', err);
      setIsSpeaking(false);
    }
  };

  // ========== TEXT TO SPEECH (Fallback) ==========
  const speakText = (text) => {
    // Cancel any ongoing speech
    synthRef.current.cancel();

    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    synthRef.current.speak(utterance);
  };

  // ========== GET STATUS TEXT ==========
  const getStatusText = () => {
    if (isSpeaking) return '🔊 Drone is speaking...';
    if (isProcessing) return '⚡ Processing...';
    if (isListening) return '🎤 Listening...';
    return 'Tap microphone to speak';
  };

  // ========== RENDER ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-4">
      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl h-[90vh] backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.3)] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/20 to-cyan-500/20 border-b border-purple-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                PranAir Patient Assistant
              </h1>
              <p className="text-purple-300 text-sm">Emergency Voice Support</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-slate-900/50 border-b border-purple-500/20 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                isListening ? 'bg-green-500 animate-pulse' :
                isProcessing ? 'bg-yellow-500 animate-pulse' :
                isSpeaking ? 'bg-blue-500 animate-pulse' :
                'bg-slate-500'
              }`}></div>
              <span className="text-slate-300 text-sm font-medium">
                {getStatusText()}
              </span>
            </div>
            {transcript && (
              <span className="text-purple-300 text-sm italic">
                {transcript}
              </span>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-br from-purple-600 to-purple-700' 
                    : 'bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/30'
                } rounded-2xl p-4 shadow-lg`}>
                  <p className="text-white text-base leading-relaxed">
                    {message.text}
                  </p>
                  <span className="text-xs text-slate-400 mt-2 block">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-6 mb-4 bg-red-500/20 border border-red-500/50 rounded-xl p-4"
          >
            <p className="text-red-300 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Microphone Control */}
        <div className="bg-slate-900/50 border-t border-purple-500/20 p-6">
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={toggleMicrophone}
              disabled={isProcessing || isSpeaking}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                isListening
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-[0_0_30px_rgba(34,197,94,0.6)] scale-110'
                  : 'bg-gradient-to-br from-purple-600 to-cyan-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-105'
              } ${(isProcessing || isSpeaking) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isListening ? (
                <div className="relative">
                  <div className="absolute inset-0 w-6 h-6 rounded-full bg-white/30 animate-ping"></div>
                  <svg className="w-8 h-8 text-white relative z-10" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
                  </svg>
                </div>
              ) : (
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
                </svg>
              )}
            </button>

            <p className="text-purple-300 text-center text-sm max-w-md">
              {isListening
                ? 'Speak now. The assistant is listening to you.'
                : 'Tap the microphone to start talking with the assistant.'}
            </p>
          </div>
        </div>

        {/* Footer Reassurance */}
        <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border-t border-purple-500/30 px-6 py-4 text-center">
          <p className="text-cyan-300 text-sm font-medium flex items-center justify-center gap-2">
            <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Help is on the way. Stay calm. You're not alone.
          </p>
        </div>
      </motion.div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #a855f7, #00f5ff);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #9333ea, #06b6d4);
        }
      `}</style>
    </div>
  );
};

export default PatientVoiceAssistant;