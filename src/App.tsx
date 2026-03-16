/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Sparkles, Volume2, VolumeX, RefreshCw, Star, Heart, Cloud } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { AudioHandler, getMicrophoneStream } from './services/audioService';
import { IMAGE_GEN_TOOL, generateImage, SYSTEM_INSTRUCTION } from './services/geminiService';
import { cn } from './lib/utils';

const COLORS = [
  'bg-pink-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400'
];

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [tharaTranscript, setTharaTranscript] = useState("");
  const [nudgeTimer, setNudgeTimer] = useState<number | null>(null);

  const sessionRef = useRef<any>(null);
  const audioHandlerRef = useRef<AudioHandler | null>(null);
  const stopMicRef = useRef<(() => void) | null>(null);

  // Nudge logic
  useEffect(() => {
    if (isConnected && !isListening) {
      const timer = window.setTimeout(() => {
        if (sessionRef.current) {
          // Send a nudge if silent for 5 seconds
          // In a real Live API, we might just wait for the model to nudge itself if instructed,
          // but we can also trigger it.
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, isListening]);

  const startSession = async () => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        alert("Please set your GEMINI_API_KEY in the environment.");
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      audioHandlerRef.current = new AudioHandler();
      await audioHandlerRef.current.init();

      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } }, // Warm, melodic voice
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: [IMAGE_GEN_TOOL] }],
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            startMic();
          },
          onmessage: async (message) => {
            // Handle Audio
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioHandlerRef.current) {
              audioHandlerRef.current.playPcmChunk(base64Audio);
            }

            // Handle Transcriptions (for UI feedback)
            if (message.serverContent?.modelTurn?.parts[0]?.text) {
              setTharaTranscript(prev => prev + " " + message.serverContent?.modelTurn?.parts[0]?.text);
            }

            // Handle Tool Calls
            const toolCall = message.toolCall;
            if (toolCall?.functionCalls) {
              for (const call of toolCall.functionCalls) {
                if (call.name === "generate_image") {
                  setIsGeneratingImage(true);
                  const imageUrl = await generateImage(call.args.prompt as string);
                  setCurrentImage(imageUrl);
                  setIsGeneratingImage(false);
                  
                  // Send response back to model
                  session.sendToolResponse({
                    functionResponses: [{
                      id: call.id,
                      name: "generate_image",
                      response: { success: true, message: "Image displayed to the child." }
                    }]
                  });
                }
              }
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              // Stop audio playback if needed
            }
          },
          onclose: () => {
            stopSession();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            stopSession();
          }
        }
      });

      sessionRef.current = session;
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  };

  const startMic = async () => {
    try {
      const stop = await getMicrophoneStream((base64) => {
        if (sessionRef.current) {
          sessionRef.current.sendRealtimeInput({
            media: { data: base64, mimeType: 'audio/pcm;rate=16000' }
          });
        }
      });
      stopMicRef.current = stop;
      setIsListening(true);
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  const stopSession = () => {
    if (stopMicRef.current) stopMicRef.current();
    if (audioHandlerRef.current) audioHandlerRef.current.stop();
    setIsConnected(false);
    setIsListening(false);
    sessionRef.current = null;
  };

  return (
    <div className="min-h-screen bg-[#FFF9F0] font-sans overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-10 left-10 text-yellow-300 opacity-50"><Star size={48} fill="currentColor" /></div>
      <div className="absolute top-20 right-20 text-blue-300 opacity-50"><Cloud size={64} fill="currentColor" /></div>
      <div className="absolute bottom-10 left-20 text-pink-300 opacity-50"><Heart size={48} fill="currentColor" /></div>
      <div className="absolute bottom-20 right-10 text-green-300 opacity-50"><Star size={32} fill="currentColor" /></div>

      <main className="max-w-4xl mx-auto px-6 py-12 flex flex-col items-center min-h-screen relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold text-[#FF6B6B] mb-2 flex items-center justify-center gap-3">
            <Sparkles className="text-yellow-400" />
            THARA
            <Sparkles className="text-yellow-400" />
          </h1>
          <p className="text-xl text-[#5A5A40] font-medium italic">Your Reading Friend!</p>
        </motion.div>

        {/* Main Display Area */}
        <div className="w-full aspect-square max-w-md bg-white rounded-[40px] shadow-2xl border-8 border-[#FFD93D] overflow-hidden relative group">
          <AnimatePresence mode="wait">
            {currentImage ? (
              <motion.img
                key={currentImage}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                src={currentImage}
                alt="Story Illustration"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-12 text-center"
              >
                <div className="w-32 h-32 bg-yellow-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <Star size={64} className="text-yellow-400" fill="currentColor" />
                </div>
                <p className="text-2xl text-gray-400 font-medium">
                  {isConnected ? "Tell THARA a word to see a magic picture!" : "Click to start our adventure!"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {isGeneratingImage && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center">
                <RefreshCw size={48} className="text-[#FF6B6B] animate-spin mb-4" />
                <p className="text-xl font-bold text-[#FF6B6B]">Making Magic...</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-12 flex flex-col items-center gap-6 w-full">
          {!isConnected ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startSession}
              className="px-12 py-6 bg-[#FF6B6B] text-white rounded-full text-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-4"
            >
              <Mic size={32} />
              Start Talking
            </motion.button>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ 
                    scale: isListening ? [1, 1.2, 1] : 1,
                    opacity: isListening ? [0.5, 1, 0.5] : 0.5
                  }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center text-white shadow-lg"
                >
                  <Mic size={32} />
                </motion.div>
                
                <button
                  onClick={stopSession}
                  className="px-8 py-4 bg-gray-200 text-gray-600 rounded-full font-bold hover:bg-gray-300 transition-colors"
                >
                  Stop Adventure
                </button>
              </div>
              
              <div className="text-center max-w-lg">
                <p className="text-[#5A5A40] font-medium text-lg animate-pulse">
                  THARA is listening...
                </p>
                {tharaTranscript && (
                  <div className="mt-4 p-4 bg-white/50 rounded-2xl border border-white text-[#5A5A40] italic">
                    "{tharaTranscript.split('.').pop()}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Sparkles */}
        <div className="mt-auto pt-12 flex gap-4">
          {COLORS.map((color, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
              className={cn("w-4 h-4 rounded-full", color)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
