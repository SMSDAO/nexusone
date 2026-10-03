import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, Mic, MicOff, Search, Brain, FolderKanban, Cpu, Volume2, ShieldAlert } from "lucide-react";

interface FrontPageProps {
  onExecutePrompt: (prompt: string) => void;
  isLoading: boolean;
}

export default function FrontPage({ onExecutePrompt, isLoading }: FrontPageProps) {
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Suggested workflow cards
  const suggestionCards = [
    {
      id: "clean",
      label: "Clean Downloads",
      description: "Organise cluttered spreadsheets, images & docs.",
      prompt: "Separate the documents, screenshots and pictures in Downloads",
      icon: <FolderKanban className="w-5 h-5 text-cyan-400" />,
      tag: "Puppeteer Loop"
    },
    {
      id: "research",
      label: "Deep Research Node",
      description: "Spider 2026 tech trends and compile complete Markdown dossier.",
      prompt: "Execute Deep Research dossier on: Quantum Cryptography and S3 Security",
      icon: <Brain className="w-5 h-5 text-indigo-400" />,
      tag: "Thought Loop"
    },
    {
      id: "purge",
      label: "Secure Force Delete",
      description: "Deletes old designs and triggers safety confirmations.",
      prompt: "Force delete OldDesign.png from Desktop with audit accountability",
      icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
      tag: "Safety Guard"
    },
    {
      id: "speech",
      label: "Synthesize Keynote",
      description: "Convert strategic pitches into high-quality vocal audio segments.",
      prompt: "Synthesize pitch: Nexus One is the next frontier of human-AI software workspaces.",
      icon: <Volume2 className="w-5 h-5 text-amber-400" />,
      tag: "Vocal Loop"
    },
    {
      id: "processes",
      label: "Audit Process Engine",
      description: "Review background memory, GPU usage and CPU statistics.",
      prompt: "Audit active processes and verify watchdog trust margins",
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
      tag: "System Loop"
    }
  ];

  // Initialize Web Speech API for dictate simulation/real dictation
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recObj = new SpeechRecognition();
      recObj.continuous = false;
      recObj.interimResults = false;
      recObj.lang = "en-US";

      recObj.onstart = () => {
        setIsListening(true);
      };

      recObj.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recObj.onerror = () => {
        setIsListening(false);
      };

      recObj.onend = () => {
        setIsListening(false);
      };

      setRecognition(recObj);
    }
  }, []);

  const handleToggleListening = () => {
    if (!speechSupported) {
      // Mock typing speech
      setIsListening(true);
      setTimeout(() => {
        setInputValue((p) => p + " Organize my Downloads folder");
        setIsListening(false);
      }, 1500);
      return;
    }

    if (isListening) {
      recognition?.stop();
    } else {
      try {
        recognition?.start();
      } catch (err) {
        // Fallback
        setIsListening(true);
        setTimeout(() => {
          setIsListening(false);
        }, 1500);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    onExecutePrompt(inputValue);
    setInputValue("");
  };

  return (
    <div className="relative flex flex-col justify-center items-center px-4 w-full min-h-[75vh]" id="nexus-front-landing">
      {/* Absolute Ambient Neon Glow Rings */}
      <div className="absolute top-1/4 left-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pulse-glow-bg pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl -translate-x-1/2 pointer-events-none" />

      {/* Hero Welcome banner */}
      <motion.div
        className="z-10 mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 bg-indigo-500/10 border border-indigo-500/20 rounded-full select-none">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="font-display text-xs font-semibold tracking-wide text-indigo-300 uppercase">
            v3.0 Production Ready Launchpad
          </span>
        </div>
        
        <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-white mb-3">
          NEXUS/<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500">ONE</span>
        </h1>
        <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-400 font-sans leading-relaxed">
          Your OS. Your Cloud. Your Intelligence. Single Unified Interface for Windows Puppeteer Automation & Local LLM Workflows.
        </p>
      </motion.div>

      {/* Central Glassmorphic Command Input Bar */}
      <motion.div
        className="w-full max-w-2xl z-10 mb-12"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <form onSubmit={handleSubmit} className="relative group">
          {/* Outer glowing halo */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500 pointer-events-none" />
          
          <div className="relative flex items-center bg-slate-950/80 border border-slate-800 rounded-2xl h-16 px-4 backdrop-blur-xl">
            <Search className="w-6 h-6 text-slate-500 mr-3 flex-shrink-0" />
            
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe or generate a Windows Puppeteer command..."
              className="w-full bg-transparent text-white text-base focus:outline-none placeholder:text-slate-500 border-none font-sans"
              disabled={isLoading}
              id="front-command-input"
            />

            {/* Mic tool with real/mock speech state */}
            <button
              type="button"
              onClick={handleToggleListening}
              className={`p-2.5 rounded-xl mr-2 transition-all ${
                isListening
                  ? "bg-red-500/30 text-red-400 animate-pulse"
                  : "hover:bg-slate-800 text-slate-400 hover:text-white"
              }`}
              title={speechSupported ? "Ditate command via Mic" : "Simulate dictation mic"}
              id="microphone-toggle"
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* Neon glowing Generate Button */}
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-sans text-sm font-semibold rounded-xl shadow-lg shadow-cyan-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 flex items-center gap-1.5"
              id="front-generate-btn"
            >
              <span>Generate</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </form>
        {isListening && (
          <p className="text-center text-xs text-red-400 mt-2 font-mono animate-pulse">
            {speechSupported ? "🎤 Speak clearly..." : "🎙️ Simulating voice recognition... Organizing Downloads"}
          </p>
        )}
      </motion.div>

      {/* Suggested horizontal scroll cards */}
      <motion.div
        className="w-full max-w-4xl z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="font-display font-medium text-xs tracking-wider text-slate-400 uppercase">
            Quick Action Workflows (Horizontal Scroll)
          </span>
          <span className="text-xs text-slate-500 hover:text-indigo-400 transition cursor-pointer select-none">
            See all 100+ Loops ➜
          </span>
        </div>

        {/* Scrollable loop area */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800 snap-x">
          {suggestionCards.map((card, i) => (
            <motion.div
              key={card.id}
              onClick={() => {
                if (!isLoading) {
                  onExecutePrompt(card.prompt);
                }
              }}
              className="flex-shrink-0 w-64 bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-1 transform duration-300 snap-center group"
              whileTap={{ scale: 0.98 }}
              id={`quick-card-${card.id}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 group-hover:border-indigo-500/20 transition-colors">
                  {card.icon}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-mono font-medium px-2 py-0.5 bg-indigo-950/40 border border-indigo-900/20 rounded">
                  {card.tag}
                </span>
              </div>
              <h3 className="text-sm font-semibold font-display text-white mb-1 group-hover:text-cyan-400 transition-colors">
                {card.label}
              </h3>
              <p className="text-xs text-slate-400 font-sans line-clamp-2">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
