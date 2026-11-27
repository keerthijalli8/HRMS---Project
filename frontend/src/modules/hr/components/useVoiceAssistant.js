import { useState, useEffect, useRef } from 'react';

export const useVoiceAssistant = (onSpeechResult) => {
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Indian English support
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript && onSpeechResult) {
        onSpeechResult(transcript);
      }
    };

    recognitionRef.current = recognition;
  }, [onSpeechResult]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("మీ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ సపోర్ట్ లేదు (Chrome లేదా Edge వాడండి).");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      window.speechSynthesis.cancel(); // AI మాట్లాడుతుంటే ఆపేస్తుంది
      recognitionRef.current.start();
    }
  };

  const speakText = (text) => {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    // మార్క్‌డౌన్ సింబల్స్ మరియు ఎమోజీలను తొలగించి క్లీన్‌గా చదవడానికి
    const cleanText = text.replace(/[*#_`~]/g, '').replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-IN';
    utterance.rate = 1.05;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return {
    isListening,
    toggleListening,
    isVoiceEnabled,
    setIsVoiceEnabled,
    isSpeaking,
    speakText,
    stopSpeaking
  };
};