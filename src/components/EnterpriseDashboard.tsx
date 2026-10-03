import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Terminal, 
  ShieldCheck, 
  Key, 
  Wallet, 
  CheckCircle2, 
  Circle, 
  Flame, 
  Trophy, 
  Gift, 
  Layout, 
  Gamepad, 
  User, 
  Copy, 
  Check, 
  ExternalLink, 
  ChevronRight, 
  HelpCircle, 
  RefreshCw, 
  Cpu, 
  Coins, 
  TrendingUp, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Compass, 
  FileText, 
  Clock, 
  Sliders, 
  Activity, 
  Zap, 
  Share2, 
  ChevronDown, 
  BookOpen, 
  Layers,
  Fingerprint
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";
import { UserProfileData } from "./UserProfilePage";
import { MockFile, ProcessItem, AuditLog, Persona } from "../types";

interface EnterpriseDashboardProps {
  userProfile: UserProfileData | null;
  files: MockFile[];
  processes: ProcessItem[];
  auditLogs: AuditLog[];
  personas: Persona[];
  trustScore: number;
  onNavigate: (screen: "front" | "canvas" | "profile" | "cyberdeck") => void;
  onOpenPersonaForge: () => void;
  onQuickExecute: (prompt: string) => void;
  initialTab?: "overview" | "goals" | "rewards" | "wallet" | "guide";
  onTriggerTutorial?: () => void;
}

interface DailyGoal {
  id: string;
  title: string;
  category: "automation" | "security" | "portfolio" | "system";
  xp: number;
  completed: boolean;
  actionText: string;
  screen?: "front" | "canvas" | "profile" | "cyberdeck";
  quickPrompt?: string;
}

interface BadgeItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  tier: "Bronze" | "Silver" | "Gold" | "Cyber-Obsidian";
}

export default function EnterpriseDashboard({
  userProfile,
  files,
  processes,
  auditLogs,
  personas,
  trustScore,
  onNavigate,
  onOpenPersonaForge,
  onQuickExecute,
  initialTab = "overview",
  onTriggerTutorial,
}: EnterpriseDashboardProps) {
  // Navigation tabs within dashboard
  const [activeTab, setActiveTab] = useState<"overview" | "goals" | "rewards" | "wallet" | "guide">(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Daily Streak and XP state
  const [streakCount, setStreakCount] = useState(5);
  const [operatorXp, setOperatorXp] = useState(1480);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [claimBonusMessage, setClaimBonusMessage] = useState("");

  // Daily Goals state
  const [goals, setGoals] = useState<DailyGoal[]>([
    {
      id: "goal_1",
      title: "Initiate Autonomous Sandbox Loop",
      category: "automation",
      xp: 50,
      completed: true,
      actionText: "Open Sandbox",
      screen: "canvas",
    },
    {
      id: "goal_2",
      title: "Inspect Vector Memory & Epistemic Audit",
      category: "system",
      xp: 35,
      completed: false,
      actionText: "Verify Audits",
      screen: "canvas",
    },
    {
      id: "goal_3",
      title: "Calibrate Active Cognitive Persona in Forge",
      category: "automation",
      xp: 45,
      completed: true,
      actionText: "Open Forge",
    },
    {
      id: "goal_4",
      title: "Synthesize Web3 Portfolio & Key Entropy",
      category: "portfolio",
      xp: 60,
      completed: false,
      actionText: "Inspect Wallet",
    },
  ]);

  // Wallet Connection Simulation State
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [connectedChain, setConnectedChain] = useState<"ETH" | "SOL" | "BTC">("ETH");
  const [walletAddress, setWalletAddress] = useState("0x71C...4982aF");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [mnemonicCopied, setMnemonicCopied] = useState(false);

  // User Guide Modal / Tab state
  const [guideCategory, setGuideCategory] = useState<"getting-started" | "tutorials" | "faqs" | "puppeteer" | "clearance" | "wallet" | "personas">("getting-started");

  // Activity filter state
  const [activityFilter, setActivityFilter] = useState<"all" | "automation" | "security" | "filesystem">("all");

  // Load saved goals and reward state from localStorage
  useEffect(() => {
    try {
      const savedGoals = localStorage.getItem("nexus_daily_goals");
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals));
      }
      const savedXp = localStorage.getItem("nexus_operator_xp");
      if (savedXp) {
        setOperatorXp(parseInt(savedXp, 10));
      }
      const savedClaim = localStorage.getItem("nexus_reward_claimed_date");
      const today = new Date().toDateString();
      if (savedClaim === today) {
        setRewardClaimed(true);
      }
    } catch (e) {
      // Local storage fallback
    }
  }, []);

  const completedGoalsCount = goals.filter((g) => g.completed).length;
  const goalProgressPercentage = Math.round((completedGoalsCount / goals.length) * 100);

  const toggleGoal = (id: string) => {
    setGoals((prev) => {
      const updated = prev.map((g) => {
        if (g.id === id) {
          const nextState = !g.completed;
          if (nextState) {
            setOperatorXp((curr) => {
              const newXp = curr + g.xp;
              localStorage.setItem("nexus_operator_xp", newXp.toString());
              return newXp;
            });
          }
          return { ...g, completed: nextState };
        }
        return g;
      });
      localStorage.setItem("nexus_daily_goals", JSON.stringify(updated));
      return updated;
    });
  };

  const handleClaimDailyReward = () => {
    if (rewardClaimed) return;
    setRewardClaimed(true);
    const bonusXp = 100;
    setOperatorXp((prev) => {
      const next = prev + bonusXp;
      localStorage.setItem("nexus_operator_xp", next.toString());
      return next;
    });
    setStreakCount((s) => s + 1);
    localStorage.setItem("nexus_reward_claimed_date", new Date().toDateString());
    setClaimBonusMessage("+100 XP Granted • 6-Day Operational Streak Secured!");
    setTimeout(() => {
      setClaimBonusMessage("");
    }, 4500);
  };

  // Web3 Private Key and Mnemonic Generator
  const generateNewKeyPair = () => {
    const hexChars = "0123456789abcdef";
    let privKey = "0x";
    for (let i = 0; i < 64; i++) {
      privKey += hexChars[Math.floor(Math.random() * hexChars.length)];
    }

    const wordList = [
      "quantum", "cipher", "matrix", "orbital", "neon", "sentinel",
      "vector", "nexus", "protocol", "glitch", "entropy", "horizon",
      "shield", "stellar", "beacon", "aurora", "chronos", "titan"
    ];
    const mnemonicWords: string[] = [];
    for (let i = 0; i < 12; i++) {
      mnemonicWords.push(wordList[Math.floor(Math.random() * wordList.length)]);
    }

    setGeneratedKey(privKey);
    setGeneratedMnemonic(mnemonicWords.join(" "));
    setKeyCopied(false);
    setMnemonicCopied(false);
  };

  const copyToClipboard = (text: string, type: "key" | "mnemonic") => {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    } else {
      setMnemonicCopied(true);
      setTimeout(() => setMnemonicCopied(false), 2000);
    }
  };

  // Portfolio Chart Data
  const portfolioHistory = [
    { day: "Mon", balance: 41200 },
    { day: "Tue", balance: 43500 },
    { day: "Wed", balance: 42900 },
    { day: "Thu", balance: 45800 },
    { day: "Fri", balance: 44900 },
    { day: "Sat", balance: 47200 },
    { day: "Sun", balance: 49450 },
  ];

  // Achievement Badges
  const badges: BadgeItem[] = [
    {
      id: "b_1",
      name: "Quantum Orchestrator",
      desc: "Ran first automated multi-agent puppeteer loop",
      icon: "⚡",
      unlocked: true,
      tier: "Cyber-Obsidian",
    },
    {
      id: "b_2",
      name: "Zero-Trust Sentinel",
      desc: "Maintained >95% safety clearance rating",
      icon: "🛡️",
      unlocked: true,
      tier: "Gold",
    },
    {
      id: "b_3",
      name: "Cognitive Architect",
      desc: "Forged 2 custom AI companions with custom system prompts",
      icon: "🧠",
      unlocked: true,
      tier: "Silver",
    },
    {
      id: "b_4",
      name: "DeFi Cryptographer",
      desc: "Synthesized encrypted cold storage key entropy",
      icon: "🪙",
      unlocked: generatedKey !== null,
      tier: "Gold",
    },
  ];

  // Filtered Activity items
  const filteredActivity = auditLogs.filter((log) => {
    if (activityFilter === "all") return true;
    if (activityFilter === "automation") return log.instruction.toLowerCase().includes("plan") || log.instruction.toLowerCase().includes("process");
    if (activityFilter === "security") return log.instruction.toLowerCase().includes("kill") || log.instruction.toLowerCase().includes("clearance");
    if (activityFilter === "filesystem") return log.instruction.toLowerCase().includes("file") || log.instruction.toLowerCase().includes("clean") || log.instruction.toLowerCase().includes("download");
    return true;
  });

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 sm:p-8 bg-slate-950/70 overflow-y-auto relative select-none" id="enterprise-dashboard-frame">
      {/* Background Neon ambient lighting */}
      <div className="absolute top-10 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* ========================================================================= */}
        {/* 1. TOP HERO: Cyber-Futuristic Glassmorphic Welcome Command Header */}
        {/* ========================================================================= */}
        <div className="relative rounded-3xl p-6 sm:p-8 backdrop-blur-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-slate-800 shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Subtle neon glowing accent bar at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-amber-400" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-amber-500/20 border border-cyan-500/30 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                  {userProfile?.avatar || "🧠"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                      LEVEL 4 EXECUTIVE ARCHITECT • CLEARANCE ACTIVE
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
                    Welcome back, <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">{userProfile?.name || "Operator"}</span>
                  </h1>
                </div>
              </div>

              <p className="text-sm font-sans text-slate-300 max-w-2xl leading-relaxed">
                {userProfile?.customGreeting || "System synchronization nominal. Your enterprise automation conduits, local cognitive models, and decentralized asset bridges are running at peak fidelity."}
              </p>
            </div>

            {/* Quick KPI Stat Chips */}
            <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
              <div className="px-4 py-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center gap-3 backdrop-blur-md">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Flame className="w-5 h-5 fill-amber-500/20 animate-pulse" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">DAILY STREAK</div>
                  <div className="text-sm font-bold font-display text-white">{streakCount} Days Active</div>
                </div>
              </div>

              <div className="px-4 py-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center gap-3 backdrop-blur-md">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">OPERATOR XP</div>
                  <div className="text-sm font-bold font-display text-indigo-300">{operatorXp.toLocaleString()} XP</div>
                </div>
              </div>

              <div className="px-4 py-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center gap-3 backdrop-blur-md">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">TRUST INDEX</div>
                  <div className="text-sm font-bold font-display text-emerald-400">{Math.round(trustScore * 100)}% Verified</div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Menu Bar */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-center sm:justify-start">
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2 text-xs font-sans font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
                  activeTab === "overview"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Executive Hub</span>
              </button>
              <button
                onClick={() => setActiveTab("goals")}
                className={`px-4 py-2 text-xs font-sans font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
                  activeTab === "goals"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Daily Goals ({completedGoalsCount}/{goals.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("rewards")}
                className={`px-4 py-2 text-xs font-sans font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
                  activeTab === "rewards"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Rewards & Badges</span>
              </button>
              <button
                onClick={() => setActiveTab("wallet")}
                className={`px-4 py-2 text-xs font-sans font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
                  activeTab === "wallet"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Web3 Wallet & Cold Keys</span>
              </button>
              <button
                onClick={() => setActiveTab("guide")}
                className={`px-4 py-2 text-xs font-sans font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
                  activeTab === "guide"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>System User Guide</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. TAB 1: EXECUTIVE HUB (OVERVIEW) */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Primary Action Feature Grid (Web & Mobile Card Style) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Card 1: Sandbox Desktop */}
              <div 
                onClick={() => onNavigate("canvas")}
                className="group p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-xl cursor-pointer shadow-xl relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all duration-300">
                    <Layout className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold font-display text-white mb-1 group-hover:text-cyan-300 transition-colors">
                    Sandbox Desktop
                  </h3>
                  <p className="text-xs font-sans text-slate-400 leading-relaxed">
                    Interactive file tree ({files.length} active files), Windows Puppeteer process manager, and robotic simulator.
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs font-mono font-semibold text-cyan-400">
                  <span>DEPLOY CONDUIT</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 2: Persona Forge */}
              <div 
                onClick={onOpenPersonaForge}
                className="group p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 transition-all duration-300 backdrop-blur-xl cursor-pointer shadow-xl relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold font-display text-white mb-1 group-hover:text-purple-300 transition-colors">
                    Persona Forge
                  </h3>
                  <p className="text-xs font-sans text-slate-400 leading-relaxed">
                    Shape cognitive companion archetypes, switch local GGUF model weights, and adjust context window depths.
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs font-mono font-semibold text-purple-400">
                  <span>{personas.length} PERSONAS FORGED</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 3: Cyber-Deck Quest */}
              <div 
                onClick={() => onNavigate("cyberdeck")}
                className="group p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 backdrop-blur-xl cursor-pointer shadow-xl relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300">
                    <Gamepad className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold font-display text-white mb-1 group-hover:text-amber-300 transition-colors">
                    Nexus Cyber-Deck
                  </h3>
                  <p className="text-xs font-sans text-slate-400 leading-relaxed">
                    Generate multi-act sci-fi codex stories or immerse in an AI Dungeon Master text adventure game.
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs font-mono font-semibold text-amber-400">
                  <span>STORY & QUEST TTY</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 4: Web3 & Keys */}
              <div 
                onClick={() => setActiveTab("wallet")}
                className="group p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 backdrop-blur-xl cursor-pointer shadow-xl relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500" />
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-300">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold font-display text-white mb-1 group-hover:text-emerald-300 transition-colors">
                    Web3 & Cold Keys
                  </h3>
                  <p className="text-xs font-sans text-slate-400 leading-relaxed">
                    Cryptographic private key generation, 12-word seed backup, and automated portfolio rebalance analytics.
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs font-mono font-semibold text-emerald-400">
                  <span>ENTERPRISE VAULT</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

            </div>

            {/* Split Row: Daily Goals Widget & Live Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT 5 COLS: Daily Goals & Streak Progress */}
              <div className="lg:col-span-5 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-display text-white">Daily Operational Goals</h3>
                      <p className="text-[11px] font-mono text-slate-400">Complete tasks to increase clearance tier</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-display text-cyan-400">{goalProgressPercentage}%</div>
                    <div className="text-[10px] font-mono text-slate-500">{completedGoalsCount} of {goals.length} done</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-amber-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${goalProgressPercentage}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>

                {/* Interactive Goal List */}
                <div className="space-y-3">
                  {goals.map((goal) => (
                    <div 
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        goal.completed 
                          ? "bg-slate-950/40 border-emerald-500/20 text-slate-400" 
                          : "bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button className="text-slate-400 hover:text-white transition">
                          {goal.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-600" />
                          )}
                        </button>
                        <div>
                          <div className={`text-xs font-semibold ${goal.completed ? "line-through text-slate-500" : "text-slate-200"}`}>
                            {goal.title}
                          </div>
                          <span className="text-[10px] font-mono text-indigo-400 font-semibold">+{goal.xp} XP</span>
                        </div>
                      </div>

                      {goal.screen && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate(goal.screen!);
                          }}
                          className="px-2.5 py-1 text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        >
                          {goal.actionText}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Claim Daily Reward Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-slate-950 border border-amber-500/30 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Daily Operations Bounty</div>
                      <div className="text-[10px] font-mono text-slate-400">Claim streak rewards every 24 hours</div>
                    </div>
                  </div>

                  <button
                    onClick={handleClaimDailyReward}
                    disabled={rewardClaimed}
                    className={`px-4 py-2 text-xs font-sans font-bold rounded-xl transition cursor-pointer shadow-lg ${
                      rewardClaimed
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                        : "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 shadow-amber-500/20 active:scale-95"
                    }`}
                  >
                    {rewardClaimed ? "Claimed Today" : "Claim +100 XP"}
                  </button>
                </div>

                {claimBonusMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-center text-xs font-mono font-bold text-emerald-400"
                  >
                    {claimBonusMessage}
                  </motion.div>
                )}
              </div>

              {/* RIGHT 7 COLS: Live Enterprise Activity Feed */}
              <div className="lg:col-span-7 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-display text-white">System Recent Activity</h3>
                      <p className="text-[11px] font-mono text-slate-400">Real-time audit log of system state mutations</p>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                    {(["all", "automation", "security", "filesystem"] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setActivityFilter(filter)}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition capitalize cursor-pointer ${
                          activityFilter === filter
                            ? "bg-slate-800 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Activity Feed Items */}
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {filteredActivity.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 font-mono text-xs">
                      No system events recorded matching this filter category.
                    </div>
                  ) : (
                    filteredActivity.map((log) => (
                      <div 
                        key={log.id}
                        className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl hover:border-slate-700 transition flex items-start justify-between gap-3 text-left"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${log.success ? "bg-emerald-400" : "bg-red-400"}`} />
                            <span className="text-xs font-semibold text-slate-200">{log.instruction}</span>
                          </div>
                          
                          {log.steps && log.steps.length > 0 && (
                            <div className="text-[11px] font-mono text-slate-400 pl-4 border-l border-slate-800 space-y-0.5 mt-1">
                              {log.steps.slice(0, 2).map((s, idx) => (
                                <div key={idx} className="truncate">
                                  <strong className="text-cyan-400">{s.action}:</strong> {s.target} {s.details && `· ${s.details}`}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 text-right font-mono text-[10px] text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 flex justify-between items-center text-xs font-mono text-slate-400 border-t border-slate-800/80">
                  <span>TOTAL INDEXED LOGS: {auditLogs.length}</span>
                  <button 
                    onClick={() => onNavigate("canvas")}
                    className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View in Sandbox Desktop</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. TAB 2: DAILY GOALS DETAILED */}
        {/* ========================================================================= */}
        {activeTab === "goals" && (
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
              <div className="max-w-2xl mb-8">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                  ENTERPRISE OPERATIONAL PROTOCOLS
                </span>
                <h2 className="text-2xl font-bold font-display text-white mt-1">
                  Daily Protocols & Milestone Quests
                </h2>
                <p className="text-xs font-sans text-slate-400 mt-2 leading-relaxed">
                  Completing daily protocol mandates advances your operator clearance tier, unlocks higher token allowances, and secures your consecutive activity streak.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      goal.completed
                        ? "bg-slate-950/40 border-emerald-500/30"
                        : "bg-slate-950/80 border-slate-800"
                    } flex flex-col justify-between gap-4`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <button 
                          onClick={() => toggleGoal(goal.id)}
                          className="mt-0.5 text-slate-400 hover:text-white transition cursor-pointer"
                        >
                          {goal.completed ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                          ) : (
                            <Circle className="w-6 h-6 text-slate-600" />
                          )}
                        </button>
                        <div>
                          <div className={`text-sm font-bold ${goal.completed ? "line-through text-slate-400" : "text-white"}`}>
                            {goal.title}
                          </div>
                          <span className="inline-block mt-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                            CATEGORY: {goal.category}
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-mono font-bold border border-indigo-500/20">
                        +{goal.xp} XP
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-xs font-sans">
                      <span className="text-slate-500">
                        Status: {goal.completed ? "Verified Complete" : "Pending Action"}
                      </span>
                      {goal.screen && (
                        <button
                          onClick={() => onNavigate(goal.screen!)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>{goal.actionText}</span>
                          <ExternalLink className="w-3 h-3 text-cyan-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. TAB 3: REWARDS & CLEARANCE TIERS */}
        {/* ========================================================================= */}
        {activeTab === "rewards" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Level & XP Progression Card */}
              <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-3xl shadow-xl shadow-cyan-500/20 text-white font-display font-black">
                    4
                  </div>
                  <h3 className="text-lg font-bold font-display text-white">Tier IV: Chief Executive</h3>
                  <p className="text-xs font-mono text-cyan-400">{operatorXp} / 2,000 Total XP</p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>Progress to Tier V</span>
                    <span>74%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 w-[74%]" />
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2 text-xs font-sans text-slate-300 text-left">
                  <div className="font-bold text-white text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    Tier IV Privileges:
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Multi-agent Windows Puppeteer loops enabled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Direct Web3 keypair creation & entropy audit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Infinite context local GGUF companion slots</span>
                  </div>
                </div>
              </div>

              {/* Badges Grid */}
              <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-6">
                <div>
                  <h3 className="text-lg font-bold font-display text-white">Clearance Badges & Accreditations</h3>
                  <p className="text-xs font-sans text-slate-400">Cryptographically verifiable operational achievements</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 text-left ${
                        badge.unlocked
                          ? "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                          : "bg-slate-950/30 border-slate-900 opacity-60"
                      }`}
                    >
                      <div className="text-2xl p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                        {badge.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold font-display text-white">{badge.name}</h4>
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-bold uppercase ${
                            badge.tier === "Cyber-Obsidian"
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                              : badge.tier === "Gold"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          }`}>
                            {badge.tier}
                          </span>
                        </div>
                        <p className="text-xs font-sans text-slate-400 leading-normal">{badge.desc}</p>
                        <div className="text-[10px] font-mono text-emerald-400 pt-1">
                          {badge.unlocked ? "✓ CLEARANCE VERIFIED" : "🔒 LOCKED • PREREQUISITES REQUIRED"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. TAB 4: WEB3 WALLET & CRYPTOGRAPHIC KEYS */}
        {/* ========================================================================= */}
        {activeTab === "wallet" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Wallet Connection & Portfolio Analysis */}
              <div className="lg:col-span-6 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-display text-white">Enterprise Web3 Vault</h3>
                      <p className="text-[10px] font-mono text-slate-400">Decentralized asset monitoring</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsWalletConnected(!isWalletConnected)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      isWalletConnected
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                    }`}
                  >
                    {isWalletConnected ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Connected: {walletAddress}</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Connect Web3 Wallet</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Portfolio Value Summary */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    TOTAL ESTIMATED ASSET EQUIVALENT
                  </div>
                  <div className="flex items-baseline gap-3">
                    <div className="text-3xl font-extrabold font-display text-white">$49,450.80</div>
                    <div className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+8.4% (7d)</span>
                    </div>
                  </div>
                </div>

                {/* Performance Chart */}
                <div className="h-44 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={portfolioHistory}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "12px", fontSize: "11px" }}
                        formatter={(val: any) => [`$${val.toLocaleString()}`, "Valuation"]}
                      />
                      <Area type="monotone" dataKey="balance" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Token Allocation Pill Breakdown */}
                <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-mono">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-[10px]">ETH ALLOCATION</div>
                    <div className="text-white font-bold mt-0.5">8.42 ETH</div>
                    <div className="text-cyan-400 text-[10px]">$26,102.00</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-[10px]">SOL ALLOCATION</div>
                    <div className="text-white font-bold mt-0.5">64.50 SOL</div>
                    <div className="text-indigo-400 text-[10px]">$11,610.00</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-[10px]">NEXUS TOKENS</div>
                    <div className="text-white font-bold mt-0.5">14,200 NXS</div>
                    <div className="text-amber-400 text-[10px]">$11,738.80</div>
                  </div>
                </div>
              </div>

              {/* Private Key Generator & Cold Storage Safe */}
              <div className="lg:col-span-6 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-display text-white">Cold Private Key Synthesizer</h3>
                      <p className="text-[10px] font-mono text-slate-400">Local entropy cryptographic generator</p>
                    </div>
                  </div>

                  <button
                    onClick={generateNewKeyPair}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 text-xs font-mono font-bold shadow-lg shadow-amber-500/15 cursor-pointer transition active:scale-95"
                  >
                    Generate Entropy Key
                  </button>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs font-sans text-amber-200 leading-relaxed flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <strong>COLD STORAGE NOTICE:</strong> Private keys and 12-word mnemonics generated below are computed strictly client-side using browser crypto entropy. Never transmit seed phrases over unsecured public channels.
                  </div>
                </div>

                {generatedKey ? (
                  <div className="space-y-4">
                    {/* Private Key Box */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                        <span>SYNTHESIZED PRIVATE KEY (HEX)</span>
                        <button
                          onClick={() => copyToClipboard(generatedKey, "key")}
                          className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {keyCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{keyCopied ? "Copied" : "Copy Key"}</span>
                        </button>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-amber-300 break-all select-all">
                        {generatedKey}
                      </div>
                    </div>

                    {/* Mnemonic Seed Phrase Box */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                        <span>12-WORD COLD MNEMONIC SEED</span>
                        <button
                          onClick={() => copyToClipboard(generatedMnemonic!, "mnemonic")}
                          className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {mnemonicCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{mnemonicCopied ? "Copied" : "Copy Seed"}</span>
                        </button>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-indigo-300 leading-loose select-all">
                        {generatedMnemonic}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 border border-dashed border-slate-800 rounded-2xl text-center space-y-3">
                    <Fingerprint className="w-10 h-10 text-slate-600 mx-auto" />
                    <div className="text-xs font-mono text-slate-400">No cryptographic key generated in this session.</div>
                    <button
                      onClick={generateNewKeyPair}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold rounded-xl transition cursor-pointer"
                    >
                      Generate Keypair Now
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. TAB 5: SYSTEM USER GUIDE & DOCUMENTATION MANUAL */}
        {/* ========================================================================= */}
        {activeTab === "guide" && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
            <div className="max-w-2xl">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                KNOWLEDGE BASE & OPERATIONAL MANUAL
              </span>
              <h2 className="text-2xl font-bold font-display text-white mt-1">
                NEXUS/ONE Comprehensive User Guide
              </h2>
              <p className="text-xs font-sans text-slate-400 mt-2 leading-relaxed">
                Step-by-step documentation detailing system orchestration, automated Puppeteer execution, clearance protocols, and multi-model persona forge.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-4 border-t border-slate-800">
              
              {/* Left Guide Sidebar */}
              <div className="lg:col-span-4 space-y-3">
                <div className="space-y-1.5">
                  {[
                    { id: "getting-started", label: "01. Getting Started Guide" },
                    { id: "tutorials", label: "02. Feature Tutorials" },
                    { id: "faqs", label: "03. Frequently Asked Questions" },
                    { id: "puppeteer", label: "04. Puppeteer Desktop Automations" },
                    { id: "clearance", label: "05. Trust Index & Watchdog" },
                    { id: "wallet", label: "06. Web3 Wallets & Cold Storage" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setGuideCategory(item.id as any)}
                      className={`w-full p-3 rounded-2xl text-left text-xs font-mono font-semibold transition cursor-pointer flex items-center justify-between ${
                        guideCategory === item.id
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40 glow-blue"
                          : "bg-slate-950/60 hover:bg-slate-950 text-slate-400 hover:text-white border border-slate-800/80"
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>

                {/* Interactive Tour Launcher Card */}
                {onTriggerTutorial && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-950 to-slate-900/80 border border-indigo-500/30 text-left space-y-3 cyber-flash-sheen">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                        Interactive Induction
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Re-run the live 4-step onboarding overlay walkthrough covering system topology, puppeteer simulation, and the cognitive forge.
                    </p>
                    <button
                      onClick={onTriggerTutorial}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Start Induction Tour</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right Content View */}
              <div className="lg:col-span-8 p-6 bg-slate-950/90 rounded-2xl border border-slate-800/80 text-left font-sans space-y-4">
                {guideCategory === "getting-started" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                      <Compass className="w-5 h-5 text-cyan-400" />
                      <span>01. Getting Started Guide</span>
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Welcome to <strong>NEXUS/ONE</strong>, the premier cyber-futuristic operating interface. This dashboard orchestrates system activities, automates browser-level Puppeteer simulation flows, and serves as an interactive cognitive command portal.
                    </p>
                    
                    <h4 className="text-sm font-bold text-indigo-400 font-display uppercase tracking-wider">Step-by-Step Initial Onboarding</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                        <strong className="text-white block font-mono">1. Forge Your Personal Clearance Profile</strong>
                        <p className="text-slate-400 font-sans">Set up your registered name, tactical operational class (role), and choose from various unique neural visual identifiers inside the Profile configuration tab.</p>
                      </div>
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                        <strong className="text-white block font-mono">2. Explore the Virtual Sandbox Desktop</strong>
                        <p className="text-slate-400 font-sans">Click on the <strong>Sandbox Desktop</strong> tab in the navigation header. You can view the live folders, monitor active background processes, track simulated memory allocations, and audit robot cursor operations.</p>
                      </div>
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                        <strong className="text-white block font-mono">3. Submit Automated System Directives</strong>
                        <p className="text-slate-400 font-sans">Open the central Command input on the main Launchpad screen and type an instruction, such as <code className="text-cyan-300 font-mono">"organize my files"</code>. The Puppeteer engine translates the prompt into click/drag steps and coordinates active execution paths.</p>
                      </div>
                    </div>
                  </div>
                )}

                {guideCategory === "tutorials" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-indigo-400" />
                      <span>02. Feature Tutorials</span>
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Follow these high-fidelity interactive tutorials to master the core features of the NEXUS/ONE workspace.
                    </p>

                    <div className="space-y-4 pt-1">
                      {/* GGUF Tutorial */}
                      <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-2">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">TUTORIAL A</span>
                        <h4 className="text-xs font-bold text-white font-display">Fine-Tuning Local GGUF Engines</h4>
                        <p className="text-xs text-slate-400 font-sans leading-relaxed">
                          1. Open the <strong>Model Forge</strong> panel via the main header shortcut. <br />
                          2. Click on the GGUF models (such as Llama-3.1 8B, Qwen 2.5 Coder, or Mistral 7B) to swap reasoning weights instantly.<br />
                          3. Drag the <strong>Temperature Slider</strong> (0.0 to 1.5) to configure creative entropy versus strict deterministic logical output.<br />
                          4. Scale the <strong>Context Window</strong> bounds to determine processing depth.
                        </p>
                      </div>

                      {/* Text Adventure Tutorial */}
                      <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-2">
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">TUTORIAL B</span>
                        <h4 className="text-xs font-bold text-white font-display">Navigating the Subterranean Crypto Vault</h4>
                        <p className="text-xs text-slate-400 font-sans leading-relaxed">
                          1. Launch the <strong>Cyber-Deck</strong> screen and initialize the <strong>Subterranean Crypto Vault (Enterprise Edition)</strong> theme.<br />
                          2. You wake up in a completely dark room. Type <code className="text-cyan-400 font-mono">"look around"</code> to analyze your surroundings.<br />
                          3. Type <code className="text-cyan-400 font-mono">"take key"</code> to pick up the GXQ Cryptographic Keycard. The item immediately populates your interactive **Enterprise Inventory Matrix** in the right column!<br />
                          4. Select an item in your inventory and click <strong>"Interact / Use Item"</strong> (or type <code className="text-cyan-400 font-mono">"unlock door with gxq"</code>) to release the locks, then move north to unlock your crypto yield!
                        </p>
                      </div>

                      {/* Avatar Generation Tutorial */}
                      <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-2">
                        <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider block">TUTORIAL C</span>
                        <h4 className="text-xs font-bold text-white font-display">AI Avatar Generation Studio</h4>
                        <p className="text-xs text-slate-400 font-sans leading-relaxed">
                          1. Open the <strong>Model Forge</strong>, switch to the <em>Personas</em> tab, and click <strong>"Forge New Persona"</strong>.<br />
                          2. Input a display name and class/role. Choose your desired neon glow theme color (Cyan, Orange, Crimson, Amber, Purple).<br />
                          3. Click <strong>"Generate Unique AI Avatar"</strong>. The enterprise image processor synthesizes a high-fidelity cryptographic SVG vector card containing your role stamp and system-sync tags, binding it directly to your companion!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {guideCategory === "faqs" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-amber-400" />
                      <span>03. Frequently Asked Questions (FAQs)</span>
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Common questions and tactical solutions regarding system operations and authentication.
                    </p>

                    <div className="space-y-3 pt-1">
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                        <strong className="text-white text-xs font-mono block">Q: Why did my profile snap load return "Missing permissions"?</strong>
                        <p className="text-xs text-slate-400 font-sans leading-relaxed">
                          A: This occurs during initial handshake boot cycles or anonymous guest mode operations. We have deployed open read clearance protocols to safely resolve this. If any connection delay occurs, click the <strong>"Initialize Console Now"</strong> bypass button to load instantly.
                        </p>
                      </div>

                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                        <strong className="text-white text-xs font-mono block">Q: How does user authentication work with Firestore profile sync?</strong>
                        <p className="text-xs text-slate-400 font-sans leading-relaxed">
                          A: Users can sign up with Email and Password or use Google clearances. Successful authentication secures a unique document under <code className="text-cyan-400 font-mono">/users/{"{userId}"}</code> in Firestore, which populates profile metadata, trusted clearance ranks, and tutorial completion flags in real-time.
                        </p>
                      </div>

                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                        <strong className="text-white text-xs font-mono block">Q: Can I run GGUF models offline?</strong>
                        <p className="text-xs text-slate-400 font-sans leading-relaxed">
                          A: Yes! When external APIs are inaccessible, the system switches to offline deterministic emulation modes. You can continue writing code, playing the text adventure game, and automating file transfers locally.
                        </p>
                      </div>

                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                        <strong className="text-white text-xs font-mono block">Q: Is the Web3 portfolio connected to a real blockchain?</strong>
                        <p className="text-xs text-slate-400 font-sans leading-relaxed">
                          A: The cold storage key generation uses client-side SHA-256 entropy. The wallet addresses and rebalancing metrics operate on standard decentralized protocol standards for educational simulation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {guideCategory === "puppeteer" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-indigo-400" />
                      <span>04. Puppeteer Desktop Simulation Engine</span>
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      When you submit prompts such as <code className="text-cyan-400 font-mono">"clean my downloads folder and organize documents"</code>, the system parses the task into MouseMove, MouseClick, KeyboardType, and FileOperation stages.
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      The virtual robot cursor navigates the desktop canvas in real time to visually execute the actions, updating disk blocks and recording audit trails.
                    </p>
                  </div>
                )}

                {guideCategory === "clearance" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <span>05. Trust Index & Safety Watchdog</span>
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      To prevent accidental system corruption, potentially destructive actions (e.g. file deletion or process termination) trigger the <strong>Safety Watchdog Modal</strong>. Operators must explicitly verify the action before execution.
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Continuous safe executions increase your Trust Score towards 100%, unlocking automated bypass clearances.
                    </p>
                  </div>
                )}

                {guideCategory === "wallet" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-amber-400" />
                      <span>06. Web3 & Decentralized Key Management</span>
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      The Web3 Vault enables connecting simulated Web3 wallets across Ethereum, Solana, and Bitcoin. You can also generate air-gapped cryptographic private keys and 12-word recovery seed phrases generated purely client-side.
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Automated portfolio rebalancing tools evaluate risk factors across your asset holdings and propose optimal yield strategies.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
