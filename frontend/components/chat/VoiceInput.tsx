"use client";

import { useState, useCallback, useRef } from "react";
import { Mic, MicOff } from "lucide-react";

// Web Speech API types
interface WebSpeechEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface WebSpeechErrorEvent {
  error: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WebSpeechRecognition = any;

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onInterim?: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTranscript, onInterim, disabled }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() => {
    if (typeof window === "undefined") return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return !!SR;
  });
  const recognitionRef = useRef<WebSpeechRecognition>(null);

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: WebSpeechEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim && onInterim) {
        onInterim(finalTranscript + interim);
      }
    };

    recognition.onerror = (event: WebSpeechErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim()) {
        onTranscript(finalTranscript.trim());
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onTranscript, onInterim]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const toggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      className="interactive focus-ring flex items-center justify-center rounded-full"
      style={{
        width: '38px',
        height: '38px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: isListening ? '#ef4444' : '#7878a0',
        boxShadow: isListening
          ? '0 0 0 4px rgba(239,68,68,0.2)'
          : 'inset 0 1px 0 rgba(255,255,255,0.06)',
        animation: isListening ? 'pulse-ring 1.2s ease-out infinite' : 'none',
      }}
      title={isListening ? "Stop recording" : "Voice input"}
    >
      {isListening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  );
}
