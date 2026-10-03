import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  Gamepad2, 
  Sparkles, 
  Sword, 
  Backpack, 
  Heart, 
  Sliders, 
  Plus, 
  X, 
  RotateCcw, 
  ArrowRight, 
  Dices, 
  Terminal, 
  Volume2, 
  ShieldAlert, 
  Loader2 
} from "lucide-react";

interface CyberDeckProps {
  onBack: () => void;
}

interface GeneratedStory {
  title: string;
  beginning: string;
  middle: string;
  end: string;
}

interface GameState {
  scenario: string;
  choices: string[];
  inventory: string[];
  health: number;
  doorLocked?: boolean;
  prompt?: string;
  condition: "playing" | "win" | "loss";
}

interface InventoryItemMeta {
  name: string;
  tag: string;
  rarity: "Legendary" | "Epic" | "Rare" | "Standard";
  color: string;
  desc: string;
  actionText: string;
  command: string;
}

const INVENTORY_CATALOG: Record<string, InventoryItemMeta> = {
  "GXQ Cryptographic Keycard": {
    name: "GXQ Cryptographic Keycard",
    tag: "GXQ-VAULT-AUTH",
    rarity: "Legendary",
    color: "text-amber-400 border-amber-500/40 bg-amber-950/30",
    desc: "Titanium cold-storage keycard embedded with 256-bit GXQ blockchain cryptographic signatures. Unlocks the subterranean vault blast door.",
    actionText: "UNLOCK BLAST DOOR WITH GXQ",
    command: "unlock door with gxq"
  },
  "Overcharged SOL Power Cell": {
    name: "Overcharged SOL Power Cell",
    tag: "SOL-ENERGY-NODE",
    rarity: "Epic",
    color: "text-orange-400 border-orange-500/40 bg-orange-950/30",
    desc: "High-density plasma battery loaded with 100 SOL electrical entropy. Powers up terminal matrices and illuminates pitch-black sectors.",
    actionText: "OVERCHARGE TERMINAL GRID",
    command: "use power cell"
  },
  "NEXUS Quantum Shard": {
    name: "NEXUS Quantum Shard",
    tag: "NEXUS-ENTROPY-CORE",
    rarity: "Epic",
    color: "text-cyan-400 border-cyan-500/40 bg-cyan-950/30",
    desc: "A resonating crystalline qubit lattice that surges with pure quantum entanglement. Restores exoskeleton shields to 100% integrity.",
    actionText: "CHANNEL ENTROPY & HEAL",
    command: "use shard"
  },
  "Quantum Comms Link": {
    name: "Quantum Comms Link",
    tag: "COMMS-SUBSYSTEM",
    rarity: "Standard",
    color: "text-indigo-400 border-indigo-500/40 bg-indigo-950/30",
    desc: "Encrypted transponder tuned to operator command frequencies. Connects directly to NEXUS/ONE mission control.",
    actionText: "TRANSMIT TELEMETRY",
    command: "look around"
  }
};

export default function CyberDeck({ onBack }: CyberDeckProps) {
  // Navigation: "story" (Story Forge) vs "game" (Adventure Game)
  const [activeTab, setActiveTab] = useState<"story" | "game">("story");

  // ==========================================
  // STATE: Story Forge
  // ==========================================
  const [keywords, setKeywords] = useState<string[]>(["neon", "operator", "quantum"]);
  const [newKeyword, setNewKeyword] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("Cyberpunk Sci-Fi");
  const [selectedTone, setSelectedTone] = useState("Mysterious & Gritty");
  const [storyPacing, setStoryPacing] = useState(50); // Slider state
  const [wordLimit, setWordLimit] = useState(300); // Slider state
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<GeneratedStory | null>(null);
  const [activeStoryAct, setActiveStoryAct] = useState<"act1" | "act2" | "act3">("act1");

  // ==========================================
  // STATE: Text Adventure Game (Quest Deck)
  // ==========================================
  const [gameTheme, setGameTheme] = useState<"crypto" | "cyberpunk" | "fantasy" | "space" | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isGameLoading, setIsGameLoading] = useState(false);
  const [gameLog, setGameLog] = useState<{ action?: string; text: string }[]>([]);
  const [customCommand, setCustomCommand] = useState("");
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<string | null>(null);

  // Story presets
  const genrePresets = ["Cyberpunk Sci-Fi", "Dark Fantasy", "Retro Space Opera", "Solarpunk Utopian", "Steampunk Rebellion"];
  const tonePresets = ["Mysterious & Gritty", "Cinematic & Heroic", "Eerie & Unsettling", "Witty & Comedic", "Melancholic & Deep"];
  const quickKeywords = ["hologram", "rebel", "cybernetic", "crystal", "cruiser", "ancient", "nanotech", "AI core", "smog", "relic"];

  // ==========================================
  // LOGIC: Story Forge
  // ==========================================
  const handleAddKeyword = (kw: string) => {
    const cleanKw = kw.trim().toLowerCase();
    if (cleanKw && !keywords.includes(cleanKw) && keywords.length < 8) {
      setKeywords([...keywords, cleanKw]);
    }
    setNewKeyword("");
  };

  const handleRemoveKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleGenerateStory = async () => {
    if (keywords.length === 0) return;
    setIsGeneratingStory(true);
    try {
      const res = await fetch("/api/story/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords,
          genre: selectedGenre,
          tone: selectedTone,
          pacing: storyPacing,
          limit: wordLimit
        })
      });
      const data = await res.json();
      if (data.success && data.story) {
        setGeneratedStory(data.story);
        setActiveStoryAct("act1");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // ==========================================
  // LOGIC: Text Adventure Game (Quest Deck)
  // ==========================================
  const handleStartGame = async (selectedTheme: "crypto" | "cyberpunk" | "fantasy" | "space" = "crypto") => {
    setGameTheme(selectedTheme);
    setIsGameLoading(true);
    setGameLog([]);
    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: selectedTheme })
      });
      const data = await res.json();
      if (data.success && data.gameState) {
        setGameState({
          scenario: data.gameState.scenario,
          choices: data.gameState.choices,
          inventory: data.gameState.inventory || [],
          health: 100,
          doorLocked: data.gameState.doorLocked !== undefined ? data.gameState.doorLocked : true,
          prompt: data.gameState.prompt,
          condition: "playing"
        });
        setGameLog([{ text: data.gameState.scenario }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGameLoading(false);
    }
  };

  const handleTakeAction = async (action: string) => {
    if (!gameState || isGameLoading) return;
    const cleanAction = action.trim();
    if (!cleanAction) return;

    setIsGameLoading(true);
    try {
      const res = await fetch("/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: gameTheme,
          previousScenario: gameState.scenario,
          actionSelected: cleanAction,
          currentInventory: gameState.inventory,
          currentHealth: gameState.health,
          doorLocked: gameState.doorLocked
        })
      });
      const data = await res.json();
      if (data.success && data.gameState) {
        const nextState = data.gameState;
        const newHealth = Math.max(0, Math.min(100, gameState.health + (nextState.healthDelta || 0)));
        const finalCondition = newHealth <= 0 ? "loss" : (nextState.condition || "playing");

        setGameState({
          scenario: nextState.scenario,
          choices: finalCondition !== "playing" ? [] : (nextState.choices || []),
          inventory: nextState.inventory || gameState.inventory,
          health: newHealth,
          doorLocked: nextState.doorLocked !== undefined ? nextState.doorLocked : gameState.doorLocked,
          prompt: nextState.prompt || gameState.prompt,
          condition: finalCondition
        });

        setGameLog(prev => [
          ...prev,
          { action: cleanAction, text: nextState.scenario }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGameLoading(false);
    }
  };

  const handleCommandFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCommand.trim() || isGameLoading) return;
    handleTakeAction(customCommand);
    setCustomCommand("");
  };

  const resetGame = () => {
    setGameTheme(null);
    setGameState(null);
    setGameLog([]);
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-8 bg-slate-950/60 overflow-y-auto" id="cyber-deck-panel">
      {/* Outer ambient soft glowing background lines */}
      <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Modern cybernetic navigation and deck top-bar */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 rounded-2xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <Gamepad2 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider uppercase">RECREATION COGNITIVE CORE</div>
            <h1 className="text-2xl font-display font-extrabold text-white">NEXUS CYBER-DECK</h1>
          </div>
        </div>

        {/* Sub-menu slider structures and tab selector */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1.5 backdrop-blur-md relative z-10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <button
            onClick={() => setActiveTab("story")}
            className={`px-5 py-2 text-xs font-sans font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "story"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Codex Story Forge</span>
          </button>
          <button
            onClick={() => setActiveTab("game")}
            className={`px-5 py-2 text-xs font-sans font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "game"
                ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sword className="w-4 h-4" />
            <span>Nexus Quest TTY</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "story" ? (
          // ==========================================
          // VIEW: Story Forge
          // ==========================================
          <motion.div
            key="story-forge-view"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.3 }}
            className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* LEFT CONFIG PANEL: Glassmorphism glowing box */}
            <div className="lg:col-span-5 bg-slate-900/40 border border-purple-500/20 rounded-3xl p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.05)] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 opacity-80" />
              
              <h2 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                <span>Story Parameter Deck</span>
              </h2>

              {/* Keyword Pool Block */}
              <div className="mb-6">
                <label className="block text-xs font-mono font-bold text-purple-300 uppercase tracking-widest mb-2">
                  Keywords Buffer ({keywords.length}/8)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddKeyword(newKeyword)}
                    placeholder="Enter manual keyword..."
                    className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-sans text-white focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
                  />
                  <button
                    onClick={() => handleAddKeyword(newKeyword)}
                    className="p-2.5 bg-purple-600/20 border border-purple-500/40 text-purple-400 rounded-xl hover:bg-purple-600/30 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Active keywords chips */}
                <div className="flex flex-wrap gap-1.5 mb-3 min-h-[32px]">
                  {keywords.map((kw, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-950/60 border border-purple-500/30 text-[10px] font-mono text-purple-200 rounded-lg shadow-[0_0_8px_rgba(168,85,247,0.1)]"
                    >
                      <span>{kw}</span>
                      <button onClick={() => handleRemoveKeyword(idx)} className="hover:text-red-400 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {keywords.length === 0 && (
                    <span className="text-xs text-slate-500 font-sans italic">Please supply at least one keyword buffer.</span>
                  )}
                </div>

                {/* Quick Add Presets with modern neon accent */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
                  <div className="text-[9px] font-mono text-slate-500 mb-2 uppercase tracking-wider">Fast Presets Injection:</div>
                  <div className="flex flex-wrap gap-1">
                    {quickKeywords.map((qkw) => (
                      <button
                        key={qkw}
                        onClick={() => handleAddKeyword(qkw)}
                        disabled={keywords.includes(qkw) || keywords.length >= 8}
                        className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[10px] font-sans text-slate-400 hover:text-white rounded transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                      >
                        +{qkw}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Genre Selector */}
              <div className="mb-6">
                <label className="block text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest mb-2">
                  Novel Genre
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {genrePresets.map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGenre(g)}
                      className={`px-3 py-2 border rounded-xl text-left text-xs transition-all cursor-pointer ${
                        selectedGenre === g
                          ? "bg-purple-900/40 border-purple-500/80 text-white shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone Selector */}
              <div className="mb-6">
                <label className="block text-xs font-mono font-bold text-yellow-300 uppercase tracking-widest mb-2">
                  Aura Tone
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {tonePresets.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTone(t)}
                      className={`px-3 py-2 border rounded-xl text-left text-xs transition-all cursor-pointer ${
                        selectedTone === t
                          ? "bg-purple-900/40 border-purple-500/80 text-white shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive sliders for cybernetic control */}
              <div className="mb-6 border-t border-slate-800/80 pt-4 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-400 uppercase tracking-wider">Story Narrative Pacing</span>
                    <span className="text-purple-400 font-bold">{storyPacing}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={storyPacing}
                    onChange={(e) => setStoryPacing(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                    <span>Mellow / Deep</span>
                    <span>Intense / Rapid</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-400 uppercase tracking-wider">Output Density Target</span>
                    <span className="text-cyan-400 font-bold">{wordLimit} Words</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="500"
                    step="50"
                    value={wordLimit}
                    onChange={(e) => setWordLimit(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                    <span>Concise Snippet</span>
                    <span>Detailed Novel</span>
                  </div>
                </div>
              </div>

              {/* Generate Trigger */}
              <button
                onClick={handleGenerateStory}
                disabled={isGeneratingStory || keywords.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-sans font-bold text-sm rounded-2xl cursor-pointer shadow-lg shadow-purple-500/10 active:scale-98 transition disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 group"
              >
                {isGeneratingStory ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Engaging Codex Generation...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-200 group-hover:rotate-12 transition-transform" />
                    <span>Synthesize Novel</span>
                  </>
                )}
              </button>
            </div>

            {/* RIGHT DISPLAY PANEL: Modern Glass book */}
            <div className="lg:col-span-7 flex flex-col h-full min-h-[500px]">
              <div className="flex-1 bg-slate-900/30 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl flex flex-col justify-between shadow-[0_4px_30px_rgba(0,0,0,0.4)] relative">
                
                {generatedStory ? (
                  <>
                    {/* Active story text panel with neon container elements */}
                    <div>
                      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                        <div>
                          <div className="text-[10px] font-mono text-purple-400 uppercase tracking-widest mb-1">GENESIS SYSTEM ARCHIVE</div>
                          <h2 className="text-2xl font-display font-black text-white">{generatedStory.title}</h2>
                        </div>
                        <span className="px-3 py-1 bg-purple-950/50 border border-purple-500/30 text-[10px] font-mono text-purple-300 rounded-full">
                          {selectedGenre}
                        </span>
                      </div>

                      {/* Acts tab menu with neon interactive clicks */}
                      <div className="flex gap-2 mb-6 bg-slate-950/60 p-1 border border-slate-800 rounded-xl max-w-sm">
                        <button
                          onClick={() => setActiveStoryAct("act1")}
                          className={`flex-1 py-1.5 text-center text-xs font-mono rounded-lg transition-all cursor-pointer ${
                            activeStoryAct === "act1"
                              ? "bg-purple-600 text-white font-bold"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          ACT I: BEG
                        </button>
                        <button
                          onClick={() => setActiveStoryAct("act2")}
                          className={`flex-1 py-1.5 text-center text-xs font-mono rounded-lg transition-all cursor-pointer ${
                            activeStoryAct === "act2"
                              ? "bg-purple-600 text-white font-bold"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          ACT II: MID
                        </button>
                        <button
                          onClick={() => setActiveStoryAct("act3")}
                          className={`flex-1 py-1.5 text-center text-xs font-mono rounded-lg transition-all cursor-pointer ${
                            activeStoryAct === "act3"
                              ? "bg-purple-600 text-white font-bold"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          ACT III: END
                        </button>
                      </div>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeStoryAct}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className="text-slate-300 font-sans text-sm sm:text-base leading-relaxed tracking-wide min-h-[220px]"
                        >
                          {activeStoryAct === "act1" && (
                            <p className="first-letter:text-4xl first-letter:font-bold first-letter:text-purple-400 first-letter:float-left first-letter:mr-2">
                              {generatedStory.beginning}
                            </p>
                          )}
                          {activeStoryAct === "act2" && (
                            <p className="first-letter:text-4xl first-letter:font-bold first-letter:text-indigo-400 first-letter:float-left first-letter:mr-2">
                              {generatedStory.middle}
                            </p>
                          )}
                          {activeStoryAct === "act3" && (
                            <p className="first-letter:text-4xl first-letter:font-bold first-letter:text-cyan-400 first-letter:float-left first-letter:mr-2">
                              {generatedStory.end}
                            </p>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    <div className="mt-8 border-t border-slate-800/80 pt-4 flex justify-between items-center text-[10px] font-mono text-slate-500">
                      <span>STORY ID: #{Math.floor(Math.random() * 90000) + 10000}</span>
                      <span className="text-purple-400 hover:underline cursor-pointer flex items-center gap-1" onClick={handleGenerateStory}>
                        <RotateCcw className="w-3 h-3" /> Re-Forge Codex
                      </span>
                    </div>
                  </>
                ) : (
                  // Initial Empty Terminal block
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-3xl min-h-[400px]">
                    <div className="w-16 h-16 rounded-full bg-slate-950 border border-slate-800/50 flex items-center justify-center text-slate-600 mb-4 animate-pulse">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="text-white font-display font-bold text-sm mb-1">Codex Synthesizer Offline</h3>
                    <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                      Select your custom story parameters on the left and click "Synthesize Novel" to generate your dynamic cybernetic story.
                    </p>
                  </div>
                )}
                
              </div>
            </div>
          </motion.div>
        ) : (
          // ==========================================
          // VIEW: Text Adventure Game (Quest Deck)
          // ==========================================
          <motion.div
            key="quest-deck-view"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            {!gameTheme ? (
              // Starting selection of theme
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Enterprise Crypto Vault (Primary Theme) */}
                <motion.div
                  onClick={() => handleStartGame("crypto")}
                  whileHover={{ y: -5 }}
                  className="bg-slate-900/60 border-2 border-cyan-500/40 hover:border-cyan-400 rounded-3xl p-6 cursor-pointer transition-all backdrop-blur-md group shadow-[0_0_25px_rgba(0,229,255,0.15)] relative overflow-hidden"
                >
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                    ENTERPRISE EDITION
                  </div>
                  <div className="p-3 bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 rounded-2xl w-fit mb-4">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-display font-extrabold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                    Subterranean Crypto Vault
                  </h3>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed mb-4">
                    Start in a dark room deep in the subterranean blockchain vault. Find the GXQ Cryptographic Keycard, interact with energy cells, and unlock the quantum blast door with crypto (GXQ, NEXUS, or SOL).
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-bold font-mono">
                    <span>Enter Dark Room</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </motion.div>

                {/* Cyberpunk Theme */}
                <motion.div
                  onClick={() => handleStartGame("cyberpunk")}
                  whileHover={{ y: -5 }}
                  className="bg-slate-900/40 border border-indigo-500/20 hover:border-indigo-400/50 rounded-3xl p-6 cursor-pointer transition-all backdrop-blur-md group"
                >
                  <div className="p-3 bg-indigo-950/40 border border-indigo-900/40 text-indigo-400 rounded-2xl w-fit mb-6">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-display font-extrabold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                    Cyberpunk Netrun
                  </h3>
                  <p className="text-xs text-slate-400 font-sans leading-relaxed mb-4">
                    Deep dive into the neural systems of Omega Corp. Override ICE safety grids, avoid patrol AI, and secure the ultimate core memory chip.
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-indigo-400 font-semibold font-mono">
                    <span>Initialize Core</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </motion.div>

                {/* Fantasy Dungeon Theme */}
                <motion.div
                  onClick={() => handleStartGame("fantasy")}
                  whileHover={{ y: -5 }}
                  className="bg-slate-900/40 border border-purple-500/20 hover:border-purple-400/50 rounded-3xl p-6 cursor-pointer transition-all backdrop-blur-md group"
                >
                  <div className="p-3 bg-purple-950/40 border border-purple-900/40 text-purple-400 rounded-2xl w-fit mb-6">
                    <Sword className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-display font-extrabold text-white mb-2 group-hover:text-purple-400 transition-colors">
                    Abyssal Dungeon
                  </h3>
                  <p className="text-xs text-slate-400 font-sans leading-relaxed mb-4">
                    Breach the ancient wards of the stone vault. Face forgotten terrors, secure magical artifacts, and claim the core relic.
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-purple-400 font-semibold font-mono">
                    <span>Recite Ward Chant</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </motion.div>
              </div>
            ) : (
              // Active adventure play zone
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* GAME TERMINAL (MAIN VIEW) */}
                <div className="lg:col-span-7 bg-slate-950/95 border border-slate-800 rounded-3xl p-6 shadow-2xl relative min-h-[480px] flex flex-col justify-between overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-amber-500 opacity-90" />
                  
                  {/* Top bar */}
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4 text-[10px] font-mono text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>VAULT LIVE TTY PROTOCOL</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {gameState && gameState.doorLocked !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          gameState.doorLocked ? "bg-amber-950/60 text-amber-400 border border-amber-800/40" : "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                        }`}>
                          {gameState.doorLocked ? "NORTH DOOR: LOCKED" : "NORTH DOOR: UNLOCKED"}
                        </span>
                      )}
                      <span>THEME: {gameTheme.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Log stream with dynamic scrolling */}
                  <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-3.5 max-h-[320px]">
                    {gameLog.map((log, idx) => (
                      <div key={idx} className="border-b border-slate-900 pb-3 last:border-0">
                        {log.action && (
                          <div className="text-[11px] font-mono font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
                            <span className="text-slate-600">&gt;</span>
                            <span className="uppercase">{log.action}</span>
                          </div>
                        )}
                        <p className="text-xs sm:text-sm text-slate-200 font-mono leading-relaxed whitespace-pre-line">
                          {log.text}
                        </p>
                      </div>
                    ))}

                    {isGameLoading && (
                      <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Compiling cryptographic action outcome...</span>
                      </div>
                    )}
                  </div>

                  {/* Interactive Command Terminal Input & Decision Options */}
                  <div>
                    {gameState && gameState.condition === "playing" && (
                      <div className="space-y-3 pt-3 border-t border-slate-900">
                        
                        {/* Free-text Command Input Bar */}
                        <form onSubmit={handleCommandFormSubmit} className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <label className="text-cyan-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                              <span>OPERATOR COMMAND PROMPT</span>
                            </label>
                            <span className="text-slate-500">Press Enter or click Execute</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 font-mono text-xs select-none">
                                &gt;
                              </span>
                              <input
                                type="text"
                                value={customCommand}
                                onChange={(e) => setCustomCommand(e.target.value)}
                                placeholder="Type command (e.g. 'look around', 'go north', 'take key', 'unlock door with gxq')..."
                                disabled={isGameLoading}
                                className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500/60 rounded-xl pl-8 pr-4 py-2.5 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 shadow-inner"
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={!customCommand.trim() || isGameLoading}
                              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-mono text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-40 shadow-lg shadow-cyan-600/20 shrink-0 flex items-center gap-1.5"
                            >
                              <span>EXECUTE</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </form>

                        {/* Quick Command Suggestions Chips */}
                        <div className="space-y-1 pt-1">
                          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Tactical Override Shortcuts:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {gameState.choices.map((choice, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleTakeAction(choice)}
                                disabled={isGameLoading}
                                className="px-2.5 py-1 bg-slate-900/90 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 rounded-lg text-[11px] font-mono transition cursor-pointer disabled:opacity-40 flex items-center gap-1"
                              >
                                <span>{choice}</span>
                                <ArrowRight className="w-2.5 h-2.5 text-slate-600" />
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Win Game Overlay screen */}
                    {gameState && gameState.condition === "win" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-emerald-950/50 border-2 border-emerald-500/40 p-6 rounded-3xl text-center space-y-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                      >
                        <Sparkles className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                        <h3 className="text-2xl font-display font-black text-white">CRYPTO VAULT UNLOCKED</h3>
                        <p className="text-xs sm:text-sm text-slate-200 max-w-md mx-auto leading-relaxed">
                          You conquered the dark room, claimed the cryptographic keycard, and successfully unlocked the vault blast door with GXQ, NEXUS, and SOL authorization!
                        </p>
                        <div className="p-3 bg-slate-900/80 rounded-2xl border border-emerald-500/30 text-xs font-mono text-emerald-300 max-w-sm mx-auto">
                          🪙 Granted: 5,000 GXQ • 250 NEXUS • 15 SOL
                        </div>
                        <button
                          onClick={resetGame}
                          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-sans font-bold rounded-xl transition cursor-pointer shadow-lg shadow-emerald-500/20"
                        >
                          Explore Another Chamber
                        </button>
                      </motion.div>
                    )}

                    {/* Loss Game Overlay screen */}
                    {gameState && gameState.condition === "loss" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-950/40 border border-red-500/30 p-6 rounded-2xl text-center space-y-4"
                      >
                        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
                        <h3 className="text-xl font-display font-black text-white">TERMINATION ENCOUNTERED</h3>
                        <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                          Your system vitals dropped to zero. The environment reclaimed your nodes.
                        </p>
                        <button
                          onClick={resetGame}
                          className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-sans font-bold rounded-xl transition cursor-pointer"
                        >
                          Retry Adventure
                        </button>
                      </motion.div>
                    )}
                  </div>

                </div>

                {/* GAME STATS & ENTERPRISE INVENTORY SYSTEM */}
                <div className="lg:col-span-5 space-y-4">
                  
                  {/* Health and Status Indicator */}
                  {gameState && (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 backdrop-blur-md">
                      <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">
                        SYSTEM VITALS
                      </h3>
                      
                      {/* Health progress bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-slate-500">INTEGRITY MATRIX</span>
                          <span className={`font-bold ${
                            gameState.health > 50 ? "text-emerald-400" : gameState.health > 20 ? "text-yellow-400" : "text-red-500"
                          }`}>{gameState.health}%</span>
                        </div>
                        <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <motion.div
                            className={`h-full bg-gradient-to-r ${
                              gameState.health > 50 ? "from-emerald-500 to-teal-400" : gameState.health > 20 ? "from-yellow-500 to-amber-400" : "from-red-600 to-rose-500"
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${gameState.health}%` }}
                            transition={{ duration: 0.4 }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enterprise Inventory System */}
                  {gameState && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 backdrop-blur-md min-h-[260px] flex flex-col justify-between space-y-4 shadow-xl">
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                          <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                            <Backpack className="w-4 h-4 text-cyan-400" />
                            <span>ENTERPRISE INVENTORY MATRIX</span>
                          </h3>
                          <span className="text-[10px] font-mono text-cyan-400 font-bold px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/40">
                            {gameState.inventory.length} ITEMS
                          </span>
                        </div>

                        {/* Interactive Item Cards */}
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                          {gameState.inventory.map((item, idx) => {
                            const meta = INVENTORY_CATALOG[item] || {
                              name: item,
                              tag: "TACTICAL-ASSET",
                              rarity: "Standard" as const,
                              color: "text-slate-300 border-slate-700 bg-slate-950/80",
                              desc: "Tactical gear item picked up from the subterranean facility.",
                              actionText: `USE ${item.toUpperCase()}`,
                              command: `use ${item.toLowerCase()}`
                            };

                            return (
                              <div
                                key={idx}
                                className="p-3 bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl transition space-y-2 group"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_8px_rgba(0,229,255,0.6)]" />
                                    <div>
                                      <h4 className="text-xs font-mono font-bold text-white group-hover:text-cyan-300 transition-colors">
                                        {meta.name}
                                      </h4>
                                      <span className="text-[9px] font-mono text-cyan-400/80 tracking-wider">
                                        [{meta.tag}]
                                      </span>
                                    </div>
                                  </div>
                                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>
                                    {meta.rarity}
                                  </span>
                                </div>

                                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                                  {meta.desc}
                                </p>

                                <button
                                  type="button"
                                  onClick={() => handleTakeAction(meta.command)}
                                  disabled={isGameLoading}
                                  className="w-full py-1.5 px-3 bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-[10px] font-mono font-bold text-cyan-300 hover:text-cyan-200 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
                                >
                                  <span>{meta.actionText}</span>
                                  <ArrowRight className="w-3 h-3 text-cyan-400" />
                                </button>
                              </div>
                            );
                          })}

                          {gameState.inventory.length === 0 && (
                            <div className="text-xs text-slate-500 font-sans italic text-center py-6 border border-dashed border-slate-800 rounded-2xl">
                              Inventory is empty. Type 'look around' to discover items in the room.
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={resetGame}
                        className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-white rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>RESET ADVENTURE CORE</span>
                      </button>
                    </div>
                  )}

                </div>

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
