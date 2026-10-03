import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Plus, 
  X, 
  Sparkles, 
  Check, 
  Cpu, 
  Webhook, 
  BrainCircuit, 
  Sliders, 
  Layers, 
  Zap, 
  HardDrive, 
  Gauge, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Code2,
  Terminal,
  FileCode2,
  Wand2,
  Image as ImageIcon,
  Palette,
  RefreshCw
} from "lucide-react";
import { Persona, GGUFModelConfig } from "../types";
import { PRESET_AI_AVATARS, generateProceduralAvatar } from "../avatarLibrary";

interface PersonaForgeProps {
  personas: Persona[];
  onToggleActive: (id: string) => void;
  onCreatePersona: (persona: { name: string; role: string; prompt: string; avatar: string }) => void;
  onClose: () => void;
}

const defaultModels: GGUFModelConfig[] = [
  {
    id: "llama3-8b",
    name: "Meta Llama-3.1 8B Instruct",
    filename: "Meta-Llama-3.1-8B-Instruct.Q4_K_M.gguf",
    quantization: "Q4_K_M",
    params: "8.03 Billion",
    vram: "~4.9 GB VRAM",
    specialty: "High-reasoning general agent loops & system logic",
    temperature: 0.70,
    contextWindow: 16384,
    topP: 0.90
  },
  {
    id: "mistral-7b",
    name: "Mistral 7B Instruct v0.3",
    filename: "Mistral-7B-Instruct-v0.3.Q5_K_M.gguf",
    quantization: "Q5_K_M",
    params: "7.24 Billion",
    vram: "~5.6 GB VRAM",
    specialty: "Ultra-fast execution, code formatting, and concise tasks",
    temperature: 0.50,
    contextWindow: 32768,
    topP: 0.85
  },
  {
    id: "qwen-7b-coder",
    name: "Qwen 2.5 Coder 7B",
    filename: "Qwen2.5-Coder-7B-Instruct.Q4_K_M.gguf",
    quantization: "Q4_K_M",
    params: "7.61 Billion",
    vram: "~4.7 GB VRAM",
    specialty: "Win32 C++, Rust compiler verification & file scripting",
    temperature: 0.20,
    contextWindow: 32768,
    topP: 0.80
  },
  {
    id: "phi35-mini",
    name: "Microsoft Phi-3.5 Mini",
    filename: "Phi-3.5-mini-instruct.Q8_0.gguf",
    quantization: "Q8_0 (High Precision)",
    params: "3.82 Billion",
    vram: "~3.4 GB VRAM",
    specialty: "Low-latency edge mobile execution & fast summaries",
    temperature: 0.30,
    contextWindow: 8192,
    topP: 0.85
  },
  {
    id: "deepseek-coder",
    name: "DeepSeek Coder V2 Lite",
    filename: "DeepSeek-Coder-V2-Lite-Instruct.Q4_K_M.gguf",
    quantization: "Q4_K_M",
    params: "15.7 Billion MoE (2.4B active)",
    vram: "~6.2 GB VRAM",
    specialty: "Multi-file refactoring, Puppeteer stage orchestration",
    temperature: 0.35,
    contextWindow: 65536,
    topP: 0.95
  }
];

export default function PersonaForge({
  personas,
  onToggleActive,
  onCreatePersona,
  onClose
}: PersonaForgeProps) {
  // Navigation tabs within Forge panel: "engine" (GGUF Model Switching & Config) vs "personas" (Active Companions & Creation)
  const [activeTab, setActiveTab] = useState<"engine" | "personas">("engine");

  // Models State
  const [selectedModelId, setSelectedModelId] = useState<string>("llama3-8b");
  const [temperature, setTemperature] = useState<number>(0.70);
  const [contextWindow, setContextWindow] = useState<number>(16384);
  const [topP, setTopP] = useState<number>(0.90);
  const [saveBanner, setSaveBanner] = useState<string>("");

  // Persona Creation State
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [prompt, setPrompt] = useState("");
  const [avatar, setAvatar] = useState("🧠");

  // AI Avatar Studio State
  const [avatarTab, setAvatarTab] = useState<"ai" | "presets" | "emoji">("ai");
  const [avatarTheme, setAvatarTheme] = useState<"cyan" | "orange" | "crimson" | "amber" | "purple">("cyan");
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  const handleGenerateAIAvatar = async () => {
    setIsGeneratingAvatar(true);
    try {
      const res = await fetch("/api/personas/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Custom Operator",
          role: role.trim() || "Cybernetic Node Architect",
          theme: avatarTheme
        })
      });
      const data = await res.json();
      if (data.success && data.avatarUrl) {
        setAvatar(data.avatarUrl);
        setSaveBanner(`✨ Generated unique AI avatar for ${name.trim() || "Custom Operator"}!`);
        setTimeout(() => setSaveBanner(""), 3500);
      } else {
        const fallbackUrl = generateProceduralAvatar(name.trim() || "Custom Operator", role.trim() || "Cybernetic Node Architect", avatarTheme);
        setAvatar(fallbackUrl);
      }
    } catch (err) {
      const fallbackUrl = generateProceduralAvatar(name.trim() || "Custom Operator", role.trim() || "Cybernetic Node Architect", avatarTheme);
      setAvatar(fallbackUrl);
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const renderPersonaAvatar = (avatarStr: string, size = "w-12 h-12") => {
    if (avatarStr.startsWith("data:") || avatarStr.startsWith("/") || avatarStr.startsWith("http")) {
      return (
        <img
          src={avatarStr}
          alt="Avatar"
          className={`${size} rounded-2xl object-cover border border-cyan-500/40 shrink-0 shadow-[0_0_12px_rgba(0,229,255,0.25)]`}
        />
      );
    }
    return (
      <span className="text-3xl p-2 rounded-2xl bg-slate-900 border border-slate-800 shrink-0 flex items-center justify-center">
        {avatarStr}
      </span>
    );
  };

  const emojiOptions = ["🌸", "🦀", "⚖️", "🏛️", "🧙", "⚡", "🛸", "🧠", "💼", "🤖", "🎯", "🛡️"];

  // Load saved GGUF engine configurations from localStorage
  useEffect(() => {
    try {
      const savedModelId = localStorage.getItem("nexus_active_gguf_model");
      if (savedModelId && defaultModels.some(m => m.id === savedModelId)) {
        setSelectedModelId(savedModelId);
      }
      const savedTemp = localStorage.getItem("nexus_gguf_temperature");
      if (savedTemp) {
        setTemperature(parseFloat(savedTemp));
      }
      const savedCtx = localStorage.getItem("nexus_gguf_context_window");
      if (savedCtx) {
        setContextWindow(parseInt(savedCtx, 10));
      }
      const savedTopP = localStorage.getItem("nexus_gguf_top_p");
      if (savedTopP) {
        setTopP(parseFloat(savedTopP));
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, []);

  const activeModelObj = defaultModels.find(m => m.id === selectedModelId) || defaultModels[0];

  const handleSelectModel = (model: GGUFModelConfig) => {
    setSelectedModelId(model.id);
    setTemperature(model.temperature);
    setContextWindow(model.contextWindow);
    setTopP(model.topP || 0.90);

    try {
      localStorage.setItem("nexus_active_gguf_model", model.id);
      localStorage.setItem("nexus_gguf_temperature", model.temperature.toString());
      localStorage.setItem("nexus_gguf_context_window", model.contextWindow.toString());
      localStorage.setItem("nexus_gguf_top_p", (model.topP || 0.90).toString());
    } catch (e) {
      // storage fallback
    }

    setSaveBanner(`Active GGUF Engine switched to: ${model.name}`);
    setTimeout(() => setSaveBanner(""), 3500);
  };

  const handleUpdateTemperature = (newVal: number) => {
    const clamped = Math.max(0, Math.min(1.5, parseFloat(newVal.toFixed(2))));
    setTemperature(clamped);
    try {
      localStorage.setItem("nexus_gguf_temperature", clamped.toString());
    } catch (e) {}
  };

  const handleUpdateContextWindow = (newVal: number) => {
    setContextWindow(newVal);
    try {
      localStorage.setItem("nexus_gguf_context_window", newVal.toString());
    } catch (e) {}
  };

  const handleApplyPreset = (presetName: string, tempVal: number, ctxVal: number, topPVal: number) => {
    setTemperature(tempVal);
    setContextWindow(ctxVal);
    setTopP(topPVal);
    try {
      localStorage.setItem("nexus_gguf_temperature", tempVal.toString());
      localStorage.setItem("nexus_gguf_context_window", ctxVal.toString());
      localStorage.setItem("nexus_gguf_top_p", topPVal.toString());
    } catch (e) {}
    setSaveBanner(`Preset applied: "${presetName}" (Temp: ${tempVal}, Context: ${ctxVal.toLocaleString()} tokens)`);
    setTimeout(() => setSaveBanner(""), 3500);
  };

  const handleCreatePersonaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !prompt.trim()) return;
    onCreatePersona({ name, role, prompt, avatar });
    setName("");
    setRole("");
    setPrompt("");
    setShowAddForm(false);
  };

  // Temperature description helper
  const getTemperatureBadge = (val: number) => {
    if (val <= 0.25) return { label: "Deterministic & Strict (Code / Math)", color: "text-cyan-400 bg-cyan-950/60 border-cyan-500/30" };
    if (val <= 0.65) return { label: "Balanced Reasoning & Automation", color: "text-indigo-400 bg-indigo-950/60 border-indigo-500/30" };
    if (val <= 1.05) return { label: "Expressive & Conversational", color: "text-amber-400 bg-amber-950/60 border-amber-500/30" };
    return { label: "High Entropy & Creative Novelty", color: "text-rose-400 bg-rose-950/60 border-rose-500/30" };
  };

  const tempBadge = getTemperatureBadge(temperature);

  return (
    <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-xl select-none" id="persona-forge-overlay">
      <motion.div
        className="w-full max-w-4xl bg-slate-900/95 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] relative"
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.25 }}
      >
        {/* Glow ambient lines */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500" />

        {/* Header Bar */}
        <div className="p-5 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold tracking-widest text-indigo-400 uppercase">
                COGNITIVE ENGINE & COMPANION FORGE
              </div>
              <h2 className="text-xl font-display font-extrabold text-white tracking-tight">
                Nexus Local Model Configuration
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 hover:text-white text-slate-400 rounded-xl cursor-pointer transition"
              id="close-forge-btn"
              title="Close Forge"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 py-2.5 bg-slate-950/50 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
          <div className="flex p-1 bg-slate-900 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab("engine")}
              className={`px-4 py-1.5 text-xs font-sans font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
                activeTab === "engine"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>GGUF Local Engines & Inference Params</span>
            </button>
            <button
              onClick={() => setActiveTab("personas")}
              className={`px-4 py-1.5 text-xs font-sans font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
                activeTab === "personas"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Active Personas ({personas.length})</span>
            </button>
          </div>

          {activeTab === "engine" && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="hidden sm:inline">Active Model:</span>
              <span className="text-white font-bold">{activeModelObj.name}</span>
            </div>
          )}
        </div>

        {/* Save confirmation banner */}
        <AnimatePresence>
          {saveBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-500/15 border-b border-emerald-500/30 px-6 py-2 text-center text-xs font-mono font-bold text-emerald-400 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{saveBanner}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Body Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-8 text-left">
          
          {/* ========================================================================= */}
          {/* TAB 1: GGUF LOCAL MODELS & INFERENCE PARAMETERS CONFIGURATION */}
          {/* ========================================================================= */}
          {activeTab === "engine" && (
            <div className="space-y-8">
              
              {/* Section 1: Model Selection Cards */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <span>Available Local GGUF Model Weights</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Select quantization format and neural architecture for local execution loops.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                    RAM-SAVING 4-BIT & 8-BIT QUANTIZATIONS
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {defaultModels.map((model) => {
                    const isSelected = selectedModelId === model.id;
                    return (
                      <div
                        key={model.id}
                        onClick={() => handleSelectModel(model)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3 ${
                          isSelected
                            ? "bg-slate-950 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40"
                            : "bg-slate-950/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-950"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold font-display text-white leading-tight">
                              {model.name}
                            </h4>
                            {isSelected ? (
                              <span className="p-1 rounded-full bg-cyan-500 text-slate-950 shrink-0">
                                <Check className="w-3 h-3 stroke-[3px]" />
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono font-bold text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                                {model.quantization}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] font-mono text-slate-400 truncate">
                            {model.filename}
                          </div>

                          <p className="text-[11px] font-sans text-slate-300 leading-normal line-clamp-2">
                            {model.specialty}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-900/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span className="text-indigo-400 font-semibold">{model.vram}</span>
                          <span>{model.params}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Model Configuration Controls (Temperature & Context Window) */}
              <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-3xl space-y-6 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
                  <div>
                    <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-400" />
                      <span>Model Inference Parameters: {activeModelObj.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Fine-tune generation entropy and memory buffer allocations for the active companion.
                    </p>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">PRESETS:</span>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("Strict Coding", 0.20, 8192, 0.80)}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 transition cursor-pointer"
                    >
                      Coding (0.20)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("Reasoning", 0.70, 16384, 0.90)}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 transition cursor-pointer"
                    >
                      Balanced (0.70)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("Creative Novel", 1.05, 32768, 0.95)}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 transition cursor-pointer"
                    >
                      Creative (1.05)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  
                  {/* Control 1: Temperature Setting */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="text-xs font-mono font-bold text-slate-300 block">
                          TEMPERATURE SETTING (SAMPLING ENTROPY)
                        </label>
                        <span className="text-[10px] text-slate-400">Controls randomness and token distribution spread</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.05"
                          min="0.0"
                          max="1.5"
                          value={temperature}
                          onChange={(e) => handleUpdateTemperature(parseFloat(e.target.value) || 0)}
                          className="w-16 bg-slate-900 border border-slate-800 rounded-lg p-1 text-center font-mono text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Interactive Slider */}
                    <input
                      type="range"
                      min="0.0"
                      max="1.5"
                      step="0.05"
                      value={temperature}
                      onChange={(e) => handleUpdateTemperature(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />

                    {/* Dynamic Label Badge */}
                    <div className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-between ${tempBadge.color}`}>
                      <span>Mode: {tempBadge.label}</span>
                      <span>{temperature.toFixed(2)} / 1.50</span>
                    </div>
                  </div>

                  {/* Control 2: Context Window Setting */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="text-xs font-mono font-bold text-slate-300 block">
                          CONTEXT WINDOW BUFFER (KV CACHE)
                        </label>
                        <span className="text-[10px] text-slate-400">Maximum token history depth allocated in VRAM</span>
                      </div>

                      <span className="text-xs font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                        {contextWindow.toLocaleString()} TOKENS
                      </span>
                    </div>

                    {/* Context Window Buttons Selector */}
                    <div className="grid grid-cols-3 gap-2">
                      {[2048, 4096, 8192, 16384, 32768, 65536].map((ctx) => {
                        const isCtxActive = contextWindow === ctx;
                        return (
                          <button
                            key={ctx}
                            type="button"
                            onClick={() => handleUpdateContextWindow(ctx)}
                            className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition cursor-pointer ${
                              isCtxActive
                                ? "bg-cyan-600/20 text-cyan-300 border-cyan-500 shadow-md shadow-cyan-500/10"
                                : "bg-slate-900 hover:bg-slate-850 text-slate-400 border-slate-800 hover:text-white"
                            }`}
                          >
                            {ctx >= 1024 ? `${ctx / 1024}k tokens` : `${ctx} tokens`}
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                      <span>ESTIMATED KV BUFFER MEMORY:</span>
                      <span className="text-white font-bold">
                        {contextWindow <= 4096 ? "~420 MB" : contextWindow <= 16384 ? "~1.2 GB" : "~2.8 GB"} VRAM
                      </span>
                    </div>
                  </div>

                </div>

                {/* Additional Sampling Params */}
                <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-slate-400">Top-P Nucleus:</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={topP}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setTopP(v);
                        try { localStorage.setItem("nexus_gguf_top_p", v.toString()); } catch (err) {}
                      }}
                      className="w-32 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                    />
                    <span className="text-xs font-mono font-bold text-white">{topP.toFixed(2)}</span>
                  </div>

                  <div className="text-xs font-mono text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Parameters auto-saved to workspace storage</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ACTIVE PERSONAS & FORGE NEW COMPANION */}
          {/* ========================================================================= */}
          {activeTab === "personas" && (
            <div className="space-y-6">
              {!showAddForm ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold font-display text-white">
                        Cognitive Companion Profiles
                      </h3>
                      <p className="text-xs text-slate-400">
                        Toggle the active companion persona that governs the Win32 automation planner.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowAddForm(true)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/20"
                      id="show-forge-addition-btn"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Forge New Persona</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {personas.map((persona) => (
                      <div
                        key={persona.id}
                        onClick={() => onToggleActive(persona.id)}
                        className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                          persona.active
                            ? "border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/10"
                            : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                        }`}
                        id={`persona-block-${persona.id}`}
                      >
                        <div className="flex items-start gap-3.5">
                          {renderPersonaAvatar(persona.avatar)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 justify-between">
                              <h4 className="text-sm font-bold font-display text-white truncate">
                                {persona.name}
                              </h4>
                              {persona.active && (
                                <span className="p-0.5 bg-indigo-500 text-slate-950 rounded-full shrink-0">
                                  <Check className="w-3 h-3 stroke-[3px]" />
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-cyan-400 font-mono mt-0.5 uppercase tracking-wide">
                              {persona.role}
                            </p>
                            <p className="text-xs text-slate-400 font-sans mt-2.5 line-clamp-3 italic leading-relaxed">
                              "{persona.prompt}"
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Creation Form */
                <form onSubmit={handleCreatePersonaSubmit} className="space-y-4 max-w-lg mx-auto bg-slate-950 p-6 rounded-3xl border border-slate-800">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                    <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest block">
                      Forge Custom Companion Archetype
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 block">COMPANION DISPLAY NAME</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ada Lovelace"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500/40 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 block">OPERATIONAL CLASS / ROLE</label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Memory Watchdog & Win32 Engineer"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500/40 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                      required
                    />
                  </div>

                  {/* Enterprise Image Generation Tool for Custom Personas */}
                  <div className="space-y-2 p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-cyan-400 font-mono font-bold flex items-center gap-1.5">
                        <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>AI AVATAR GENERATION STUDIO</span>
                      </span>
                      <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                        <button
                          type="button"
                          onClick={() => setAvatarTab("ai")}
                          className={`px-2 py-0.5 rounded-md transition ${avatarTab === "ai" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"}`}
                        >
                          AI Gen
                        </button>
                        <button
                          type="button"
                          onClick={() => setAvatarTab("presets")}
                          className={`px-2 py-0.5 rounded-md transition ${avatarTab === "presets" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"}`}
                        >
                          Archetypes
                        </button>
                        <button
                          type="button"
                          onClick={() => setAvatarTab("emoji")}
                          className={`px-2 py-0.5 rounded-md transition ${avatarTab === "emoji" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"}`}
                        >
                          Emojis
                        </button>
                      </div>
                    </div>

                    {avatarTab === "ai" && (
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-cyan-400/40 p-0.5 bg-slate-950 shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                            {avatar.startsWith("data:") || avatar.startsWith("/") || avatar.startsWith("http") ? (
                              <img src={avatar} alt="AI Preview" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">{avatar}</div>
                            )}
                          </div>

                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              {(["cyan", "orange", "crimson", "amber", "purple"] as const).map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setAvatarTheme(t)}
                                  className={`w-5 h-5 rounded-full border-2 transition ${
                                    avatarTheme === t ? "scale-110 border-white shadow-sm" : "border-transparent opacity-60 hover:opacity-100"
                                  } ${
                                    t === "cyan" ? "bg-cyan-400" :
                                    t === "orange" ? "bg-orange-500" :
                                    t === "crimson" ? "bg-rose-500" :
                                    t === "amber" ? "bg-amber-400" : "bg-purple-500"
                                  }`}
                                  title={`Theme: ${t}`}
                                />
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-400 font-sans">
                              Synthesizes unique holographic avatar based on role and name.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleGenerateAIAvatar}
                          disabled={isGeneratingAvatar}
                          className="w-full py-2 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-mono text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                        >
                          {isGeneratingAvatar ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Synthesizing Neural Avatar...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                              <span>Generate Unique AI Avatar</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {avatarTab === "presets" && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {PRESET_AI_AVATARS.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => setAvatar(p.image)}
                            className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                              avatar === p.image ? "border-cyan-400 bg-cyan-950/40 shadow-sm" : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                            }`}
                          >
                            <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[11px] font-bold text-white truncate">{p.name}</div>
                              <div className="text-[9px] text-slate-400 font-mono truncate">{p.roleMatch}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {avatarTab === "emoji" && (
                      <div className="flex gap-2 flex-wrap pt-1">
                        {emojiOptions.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setAvatar(emoji)}
                            className={`text-lg p-1.5 rounded-xl border cursor-pointer transition ${
                              avatar === emoji ? "border-indigo-500 bg-indigo-950/60" : "border-slate-800 hover:bg-slate-900"
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 block">SYSTEM DIRECTIVE PROMPT</label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Specify tone, cognitive constraints, and behavior directives..."
                      className="w-full h-24 bg-slate-900 border border-slate-800 focus:border-indigo-500/40 rounded-xl p-2.5 text-xs text-white focus:outline-none resize-none"
                      required
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-3 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans text-xs rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-sans text-xs font-bold rounded-xl cursor-pointer flex gap-1.5 items-center"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Instantiate Persona</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
