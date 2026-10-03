import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Terminal, 
  ShieldAlert, 
  Check, 
  RefreshCw, 
  Layers, 
  Layout, 
  ArrowLeft, 
  LogOut, 
  Gamepad, 
  User as UserIcon, 
  LayoutDashboard, 
  Compass, 
  Sliders,
  BookOpen
} from "lucide-react";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import FrontPage from "./components/FrontPage";
import ConduitBar from "./components/ConduitBar";
import CanvasWorkspace from "./components/CanvasWorkspace";
import PersonaForge from "./components/PersonaForge";
import AuthScreen from "./components/AuthScreen";
import UserProfilePage, { UserProfileData } from "./components/UserProfilePage";
import InteractiveTutorial from "./components/InteractiveTutorial";
import CyberDeck from "./components/CyberDeck";
import EnterpriseDashboard from "./components/EnterpriseDashboard";
import { MockFile, ProcessItem, AuditLog, Persona, PuppetPlan } from "./types";

export default function App() {
  // Authentication & Profile States
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Navigation: "dashboard" (enterprise command hub) vs "front" (launcher) vs "canvas" (sandbox desktop) vs "profile" (operator configuration page) vs "cyberdeck"
  const [activeScreen, setActiveScreen] = useState<"dashboard" | "front" | "canvas" | "profile" | "cyberdeck">("dashboard");
  const [dashboardTab, setDashboardTab] = useState<"overview" | "goals" | "rewards" | "wallet" | "guide">("overview");
  
  // Real-time backend states
  const [files, setFiles] = useState<MockFile[]>([]);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [activePersona, setActivePersona] = useState<Persona | null>(null);
  
  // Loader status
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [trustScore, setTrustScore] = useState(0.85); // Safety watchdog trust level

  // Active puppeteer plan parsing simulation
  const [activePlan, setActivePlan] = useState<PuppetPlan | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingConfirmationPlan, setPendingConfirmationPlan] = useState<PuppetPlan | null>(null);
  const [pendingPromptText, setPendingPromptText] = useState("");

  // Modals state
  const [showPersonaForgeModal, setShowPersonaForgeModal] = useState(false);
  const [showTutorialManualModal, setShowTutorialManualModal] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Subscribe to Firebase Authentication flow
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let isMounted = true;

    // Safety watchdog: ensure loader never hangs for more than 1200ms on mobile or iframe
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setCheckingAuth(false);
      }
    }, 1200);

    // If Firebase Auth already has user cached synchronously
    if (auth.currentUser) {
      setUser(auth.currentUser);
      clearTimeout(safetyTimer);
      setCheckingAuth(false);
    }

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (!isMounted) return;
        clearTimeout(safetyTimer);
        setUser(currentUser);
        
        if (currentUser) {
          if (unsubscribeProfile) {
            unsubscribeProfile();
            unsubscribeProfile = null;
          }
          // Real-time listener for profile custom settings to ensure instant propagation on edits
          const profileRef = doc(db, "users", currentUser.uid);
          unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
            if (!isMounted) return;
            let localTutorialDone = false;
            try {
              localTutorialDone = localStorage.getItem(`nexus_tutorial_completed_${currentUser.uid}`) === "true";
            } catch (e) {
              // Ignore storage errors
            }

            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfileData;
              setUserProfile({
                ...data,
                tutorialCompleted: data.tutorialCompleted || localTutorialDone
              });
            } else {
              // fallback if document sync is in progress
              setUserProfile(prev => ({
                userId: currentUser.uid,
                name: currentUser.displayName || "Operator",
                email: currentUser.email || "unknown@operator.local",
                role: "AI Workspace Operator",
                avatar: "🧠",
                trustedOperator: currentUser.email?.toLowerCase() === "gxqstudio@gmail.com",
                tutorialCompleted: prev?.tutorialCompleted || localTutorialDone
              }));
            }
          }, (err) => {
            // Gracefully ignore error during sign-out or session invalidation and load fallback profile
            console.warn("Profile snapshot read encountered notice, resolving fallback profile:", err);
            if (!isMounted) return;
            setUserProfile(prev => prev || ({
              userId: currentUser.uid,
              name: currentUser.displayName || "Operator",
              email: currentUser.email || "unknown@operator.local",
              role: "AI Workspace Operator",
              avatar: "🧠",
              trustedOperator: currentUser.email?.toLowerCase() === "gxqstudio@gmail.com",
              tutorialCompleted: true
            }));
            setCheckingAuth(false);
          });

          // Trigger loading of background files models
          fetchInitialState();
        } else {
          if (unsubscribeProfile) {
            unsubscribeProfile();
            unsubscribeProfile = null;
          }
          setUserProfile(null);
        }
        setCheckingAuth(false);
      },
      (error) => {
        console.warn("Auth state observer error, continuing with fallback:", error);
        clearTimeout(safetyTimer);
        if (isMounted) {
          setCheckingAuth(false);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
      unsubscribeAuth();
    };
  }, []);

  const fetchInitialState = () => {
    // Health and base fetch with safe individual catch handlers
    Promise.all([
      fetch("/api/fs").then((r) => r.json()).catch(() => ({ files: [] })),
      fetch("/api/processes").then((r) => r.json()).catch(() => ({ processes: [] })),
      fetch("/api/personas").then((r) => r.json()).catch(() => ({ personas: [] })),
      fetch("/api/audit").then((r) => r.json()).catch(() => ({ logs: [] }))
    ])
      .then(([fsData, procData, persData, auditData]) => {
        if (fsData && fsData.files) setFiles(fsData.files);
        if (procData && procData.processes) setProcesses(procData.processes);
        if (persData && persData.personas && persData.personas.length > 0) {
          setPersonas(persData.personas);
          const active = persData.personas.find((p: Persona) => p.active);
          setActivePersona(active || persData.personas[0]);
        }
        if (auditData && auditData.logs) setAuditLogs(auditData.logs);
      })
      .catch((err) => {
        console.error("Express container backend error during sync. Operating on fallback local client:", err);
      });
  };

  const handleRestoreSnapshot = (restoredFiles: MockFile[], restoredProcesses: ProcessItem[], restoredLogs: AuditLog[]) => {
    setFiles(restoredFiles);
    setProcesses(restoredProcesses);
    setAuditLogs(restoredLogs);
  };

  // Central Core Promise Router Executor
  const handleExecutePrompt = async (promptText: string) => {
    if (!promptText.trim() || isApiLoading) return;
    setIsApiLoading(true);

    // Swap viewscreen immediately to show active sandbox execution visually
    setActiveScreen("canvas");

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: promptText })
      });
      const data = await res.json();

      if (data.success && data.simulationPlan) {
        const plan: PuppetPlan = data.simulationPlan;
        
        // Safety guard verification interceptor
        if (plan.requires_confirmation) {
          setPendingConfirmationPlan(plan);
          setPendingPromptText(promptText);
          setShowConfirmationModal(true);
        } else {
          // Fire plan straight to robot simulator inside sandbox
          setActivePlan(plan);
          if (data.files) setFiles(data.files);
          if (data.audit) setAuditLogs((prev) => [data.audit, ...prev]);
        }
      }
    } catch (err) {
      console.error("Execution error:", err);
    } finally {
      setIsApiLoading(false);
    }
  };

  // Safe Clearance approve action by user
  const handleApproveSafetyClearance = () => {
    if (!pendingConfirmationPlan) return;
    setActivePlan(pendingConfirmationPlan);
    
    // Process matching mock deletions or safety alterations that were held back
    const matchingStep = pendingConfirmationPlan.steps.find(s => s.details?.toLowerCase().includes("delete") || s.details?.toLowerCase().includes("remove"));
    if (matchingStep) {
      const targetSource = matchingStep.target;
      // Triggers mock deletions
      fetch("/api/fs/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "delete", source: targetSource })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.files) {
            setFiles(data.files);
          }
        });
    }

    // Refresh audits
    fetch("/api/audit")
      .then((r) => r.json())
      .then((data) => {
        if (data.logs) setAuditLogs(data.logs);
      });

    // Award trust rating increment on continuous validations
    setTrustScore((prev) => Math.min(prev + 0.05, 1.0));
    setPendingConfirmationPlan(null);
    setShowConfirmationModal(false);
  };

  // Handle companion toggle in Forge
  const handleToggleActivePersona = (id: string) => {
    fetch("/api/personas/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.personas) {
          setPersonas(data.personas);
          const active = data.personas.find((p: Persona) => p.active);
          setActivePersona(active || data.personas[0]);
        }
      });
  };

  // Custom persona creation
  const handleCreateNewPersona = (rawP: { name: string; role: string; prompt: string; avatar: string }) => {
    fetch("/api/personas/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rawP)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.personas) {
          setPersonas(data.personas);
        }
      });
  };

  // Loader screen before app binds
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
        {/* Cyber Neon ambient lights */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-amber-500/20 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-mono tracking-widest text-slate-300 font-semibold uppercase">
              RESOLVING CRYPTOGRAPHIC OVERLAYS...
            </h3>
            <p className="text-[11px] font-sans text-slate-500">
              Verifying security enclave and multi-chain telemetry
            </p>
          </div>

          {/* Instant skip / initialize button in case of mobile network delay */}
          <button
            onClick={() => setCheckingAuth(false)}
            className="mt-4 px-5 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-cyan-400 hover:text-white border border-cyan-500/30 hover:border-cyan-400/60 text-xs font-mono font-bold rounded-xl cursor-pointer transition shadow-lg shadow-cyan-500/15"
          >
            INITIALIZE CONSOLE NOW &gt;&gt;
          </button>
        </div>
      </div>
    );
  }

  // Auth Screen block if unauthorized to use system and not in guest mode
  if (!user && !isGuestMode) {
    return (
      <AuthScreen 
        onAuthSuccess={() => fetchInitialState()} 
        onGuestAccess={() => {
          setIsGuestMode(true);
          setUserProfile({
            userId: "guest_architect",
            name: "Lead Executive Operator",
            email: "operator@nexus.one",
            role: "AI Workspace Operator",
            avatar: "🧠",
            trustedOperator: true,
            tutorialCompleted: true,
            customGreeting: "Access Granted. Welcome to NEXUS/ONE Live Command Terminal."
          });
          fetchInitialState();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden" id="nexus-master-frame">
      {/* Top Main Navigation Header Bar (Desktop & Tablet) */}
      <header className="h-16 bg-slate-950/90 border-b border-slate-900/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 relative z-30 select-none">
        {/* Brand Identity */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer group" 
          onClick={() => {
            setActiveScreen("dashboard");
            setDashboardTab("overview");
          }}
          title="Return to Executive Hub"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-amber-500 flex items-center justify-center font-display font-black text-xs text-white shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
            N
          </div>
          <span className="font-display font-extrabold tracking-wider text-base text-white">
            NEXUS/<span className="text-cyan-400 text-glow-cyan">ONE</span>
          </span>
          <span className="hidden xl:inline-block px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-indigo-950/80 border border-indigo-500/30 text-indigo-300">
            ENTERPRISE v3.8
          </span>
        </div>

        {/* Organized Navigation Screen Switches (Desktop / Tablet) */}
        <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {/* 1. Executive Hub */}
          <button
            onClick={() => {
              setActiveScreen("dashboard");
              setDashboardTab("overview");
            }}
            className={`px-3 py-1.5 text-xs font-semibold font-sans rounded-xl cursor-pointer select-none flex items-center gap-2 transition-all ${
              activeScreen === "dashboard" && dashboardTab !== "guide"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 glow-blue"
                : "bg-slate-900/40 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800/80"
            }`}
            id="nav-dashboard"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Executive Hub</span>
          </button>
          
          {/* 2. Sandbox Desktop */}
          <button
            onClick={() => {
              setActiveScreen("canvas");
              fetchInitialState(); // Refresh folders
            }}
            className={`px-3 py-1.5 text-xs font-semibold font-sans rounded-xl cursor-pointer select-none flex items-center gap-2 transition-all ${
              activeScreen === "canvas"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 glow-blue"
                : "bg-slate-900/40 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800/80"
            }`}
            id="nav-canvas"
          >
            <Layout className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sandbox Desktop</span>
          </button>

          {/* 3. Cyber-Deck */}
          <button
            onClick={() => setActiveScreen("cyberdeck")}
            className={`px-3 py-1.5 text-xs font-semibold font-sans rounded-xl cursor-pointer select-none flex items-center gap-2 transition-all ${
              activeScreen === "cyberdeck"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 glow-orange"
                : "bg-slate-900/40 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800/80"
            }`}
            id="nav-cyberdeck"
          >
            <Gamepad className="w-3.5 h-3.5 text-amber-400" />
            <span>Cyber-Deck</span>
          </button>

          {/* 4. Model & Persona Forge */}
          <button
            onClick={() => setShowPersonaForgeModal(true)}
            className="px-3 py-1.5 text-xs font-semibold font-sans rounded-xl cursor-pointer select-none flex items-center gap-2 transition-all bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/40 hover:border-purple-400/60 shadow-md shadow-purple-500/10"
            id="nav-forge"
            title="Open GGUF Model & Persona Forge"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>Model Forge</span>
          </button>

          {/* 5. User Guide */}
          <button
            onClick={() => {
              setActiveScreen("dashboard");
              setDashboardTab("guide");
            }}
            className={`px-3 py-1.5 text-xs font-semibold font-sans rounded-xl cursor-pointer select-none flex items-center gap-2 transition-all ${
              activeScreen === "dashboard" && dashboardTab === "guide"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 glow-yellow"
                : "bg-slate-900/40 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800/80"
            }`}
            id="nav-guide"
            title="Open System User Guide"
          >
            <BookOpen className="w-3.5 h-3.5 text-yellow-400" />
            <span>User Guide</span>
          </button>
        </div>

        {/* Right Utilities (Profile + Logout) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Launchpad prompt trigger */}
          <button
            onClick={() => setActiveScreen("front")}
            className={`p-2 rounded-xl text-xs font-semibold font-sans transition-all cursor-pointer ${
              activeScreen === "front"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-slate-900/40 hover:bg-slate-900 text-slate-400 hover:text-cyan-300 border border-slate-800/80"
            }`}
            title="Open Quick Prompt Launchpad"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Minimal dividing rule */}
          <span className="h-5 w-px bg-slate-800 mx-0.5 shrink-0" />

          {/* Profile Chip trigger */}
          <button
            onClick={() => setActiveScreen("profile")}
            className={`px-3 py-1.5 text-xs font-semibold font-sans rounded-xl cursor-pointer select-none flex items-center gap-2 transition-all ${
              activeScreen === "profile"
                ? "bg-slate-800 border-indigo-500/50 text-white shadow-md shadow-indigo-500/20"
                : "hover:bg-slate-900 border-slate-800/80 text-slate-300 hover:text-white"
            } border bg-slate-900/60`}
            id="nav-profile"
            title="Configure User Profile Specs"
          >
            {userProfile?.avatar && (userProfile.avatar.startsWith("data:") || userProfile.avatar.startsWith("/") || userProfile.avatar.startsWith("http")) ? (
              <img src={userProfile.avatar} alt="Avatar" className="w-5 h-5 rounded-full object-cover shrink-0 border border-cyan-400/40" />
            ) : (
              <span className="text-base shrink-0">{userProfile?.avatar || "🧠"}</span>
            )}
            <span className="max-w-[80px] sm:max-w-[120px] truncate hidden sm:inline">{userProfile?.name || "Operator"}</span>
          </button>

          {/* Force Disconnect session */}
          <button
            onClick={() => {
              setIsGuestMode(false);
              setUserProfile(null);
              setUser(null);
              signOut(auth);
            }}
            className="p-2 hover:bg-red-500/15 text-slate-400 hover:text-red-400 rounded-xl border border-transparent hover:border-red-500/30 cursor-pointer transition shrink-0"
            id="nav-logout-btn"
            title="Disconnect Terminal Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Primary Screens Router container */}
      <main className="relative flex-1 pb-20 md:pb-0" id="screens-frame">
        <AnimatePresence mode="wait">
          {activeScreen === "dashboard" ? (
            <motion.div
              key="dashboard-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <EnterpriseDashboard
                userProfile={userProfile}
                files={files}
                processes={processes}
                auditLogs={auditLogs}
                personas={personas}
                trustScore={trustScore}
                onNavigate={(screen) => setActiveScreen(screen)}
                onOpenPersonaForge={() => setShowPersonaForgeModal(true)}
                onQuickExecute={handleExecutePrompt}
                initialTab={dashboardTab}
                onTriggerTutorial={() => setShowTutorialManualModal(true)}
              />
            </motion.div>
          ) : activeScreen === "front" ? (
            <motion.div
              key="front-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FrontPage onExecutePrompt={handleExecutePrompt} isLoading={isApiLoading} />
            </motion.div>
          ) : activeScreen === "canvas" ? (
            <motion.div
              key="canvas-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CanvasWorkspace
                files={files}
                processes={processes}
                auditLogs={auditLogs}
                personas={personas}
                activePersona={activePersona || personas[0]}
                onChangeFiles={setFiles}
                onChangeProcesses={setProcesses}
                onExecutePrompt={handleExecutePrompt}
                activePlan={activePlan}
                isLoading={isApiLoading}
                onClearPlan={() => setActivePlan(null)}
              />
            </motion.div>
          ) : activeScreen === "profile" ? (
            <motion.div
              key="profile-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <UserProfilePage
                onBack={() => setActiveScreen("dashboard")}
                trustScore={trustScore}
                filesCount={files.length}
              />
            </motion.div>
          ) : (
            <motion.div
              key="cyberdeck-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CyberDeck
                onBack={() => setActiveScreen("dashboard")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Translucent Conduit Bar (shown when activeScreen is canvas) */}
      {activePersona && activeScreen === "canvas" && (
        <ConduitBar
          activePersona={activePersona}
          onChangePersona={() => setShowPersonaForgeModal(true)}
          onExecutePrompt={handleExecutePrompt}
          isLoading={isApiLoading}
          trustScore={trustScore}
          files={files}
          processes={processes}
          auditLogs={auditLogs}
          onRestoreSnapshot={handleRestoreSnapshot}
        />
      )}

      {/* ========================================================= */}
      {/* Modal 1: Persona Forge Panel overlay */}
      {/* ========================================================= */}
      {showPersonaForgeModal && activePersona && (
        <PersonaForge
          personas={personas}
          onToggleActive={handleToggleActivePersona}
          onCreatePersona={handleCreateNewPersona}
          onClose={() => setShowPersonaForgeModal(false)}
        />
      )}

      {/* ========================================================= */}
      {/* Modal 2: Safety Clearances Confirmation dialog */}
      {/* ========================================================= */}
      {showConfirmationModal && pendingConfirmationPlan && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 select-none backdrop-blur-md">
          <motion.div
            className="w-full max-w-md bg-slate-900 border border-yellow-500/30 rounded-3xl overflow-hidden p-6 shadow-2xl relative"
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
          >
            {/* Warning visual symbol */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
              <div className="p-2.5 bg-yellow-500/10 text-yellow-500 rounded-2xl border border-yellow-500/25">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold font-display text-white">
                  Safety Watchdog: Confirmation Required
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  Puppeteer clearance ID: #{Math.floor(Math.random() * 900000) + 100000}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-xs text-slate-300 leading-relaxed font-sans text-left">
                You ordered the execution loop: <strong className="text-white italic">"{pendingPromptText}"</strong>.
                This instructs automated modifications that our safety governor flags as <span className="text-yellow-400 font-semibold font-mono">{pendingConfirmationPlan.safety_level.toUpperCase()} LEVEL accountability</span>.
              </div>

              {/* Action breakdown preview */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-left">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-2">
                  Staged System Actions Plan:
                </span>
                <div className="space-y-2">
                  {pendingConfirmationPlan.steps.map((step, i) => {
                    let tooltipContent = `Standard automation directive queued for system execution targeting: ${step.target}.`;
                    const actionLower = step.action.toLowerCase();
                    if (actionLower.includes("kill") || actionLower.includes("terminate")) {
                      tooltipContent = `Invokes SIGKILL interrupt via Safety daemon to force terminate ${step.target}.`;
                    } else if (actionLower.includes("launch") || actionLower.includes("spawn") || actionLower.includes("start")) {
                      tooltipContent = `Spawns robust child_process fork for ${step.target} returning control to sandbox TTY.`;
                    } else if (actionLower.includes("create") || actionLower.includes("write")) {
                      tooltipContent = `Executes fs.writeFile to virtual filesystem block at target path: ${step.target}.`;
                    } else if (actionLower.includes("delete") || actionLower.includes("remove")) {
                      tooltipContent = `Destructive operation bypassing Recycle Bin. Invokes unrecoverable unlink routine on target: ${step.target}.`;
                    }

                    return (
                      <div key={i} className="group relative flex gap-2 items-start font-mono text-[10px] text-slate-300">
                        <span className="text-yellow-500 shrink-0 select-none cursor-help group-hover:text-amber-400">[{i+1}]</span>
                        <div className="flex-1 cursor-help border-b border-transparent group-hover:border-slate-700 pb-0.5 transition-colors">
                          <strong className="text-white font-semibold">{step.action}:</strong>{" "}
                          <span className="text-slate-400">{step.details}</span>
                        </div>
                        
                        {/* Interactive Tooltip popup */}
                        <div className="absolute left-0 bottom-full mb-1 min-w-[200px] w-auto max-w-[280px] bg-indigo-950/95 border border-indigo-500/50 shadow-xl shadow-indigo-500/10 rounded-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 transform translate-y-1 group-hover:translate-y-0">
                          <div className="text-[9px] text-indigo-200 font-sans leading-relaxed tracking-wide">
                            <strong className="block text-indigo-300 font-mono mb-0.5 border-b border-indigo-500/30 pb-0.5">OPS DESCRIPTION</strong>
                            {tooltipContent}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action decisions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowConfirmationModal(false);
                    setPendingConfirmationPlan(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans text-xs font-bold rounded-xl cursor-pointer"
                >
                  Reject Action
                </button>
                <button
                  onClick={handleApproveSafetyClearance}
                  className="flex-1 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-sans text-xs font-bold rounded-xl shadow-lg shadow-yellow-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  <span>Clear For Automation</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Mobile Web App Cyber Glassmorphic Bottom Dock */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/85 backdrop-blur-2xl border-t border-slate-800/80 px-2 py-2 select-none shadow-2xl">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {/* Hub */}
          <button
            onClick={() => {
              setActiveScreen("dashboard");
              setDashboardTab("overview");
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition cursor-pointer ${
              activeScreen === "dashboard" && dashboardTab !== "guide"
                ? "text-cyan-400 bg-cyan-950/40 glow-blue"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="text-[10px] font-mono font-semibold">Hub</span>
          </button>

          {/* Desktop */}
          <button
            onClick={() => {
              setActiveScreen("canvas");
              fetchInitialState();
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition cursor-pointer ${
              activeScreen === "canvas"
                ? "text-indigo-400 bg-indigo-950/40 glow-blue"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layout className="w-4 h-4" />
            <span className="text-[10px] font-mono font-semibold">Desktop</span>
          </button>

          {/* Deck */}
          <button
            onClick={() => setActiveScreen("cyberdeck")}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition cursor-pointer ${
              activeScreen === "cyberdeck"
                ? "text-amber-400 bg-amber-950/40 glow-orange"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Gamepad className="w-4 h-4" />
            <span className="text-[10px] font-mono font-semibold">Deck</span>
          </button>

          {/* Forge */}
          <button
            onClick={() => setShowPersonaForgeModal(true)}
            className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-purple-300 hover:text-purple-200 transition cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] font-mono font-semibold">Forge</span>
          </button>

          {/* Guide */}
          <button
            onClick={() => {
              setActiveScreen("dashboard");
              setDashboardTab("guide");
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition cursor-pointer ${
              activeScreen === "dashboard" && dashboardTab === "guide"
                ? "text-yellow-400 bg-yellow-950/40 glow-yellow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] font-mono font-semibold">Guide</span>
          </button>

          {/* Profile */}
          <button
            onClick={() => setActiveScreen("profile")}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition cursor-pointer ${
              activeScreen === "profile"
                ? "text-white bg-slate-800"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {userProfile?.avatar && (userProfile.avatar.startsWith("data:") || userProfile.avatar.startsWith("/") || userProfile.avatar.startsWith("http")) ? (
              <img src={userProfile.avatar} alt="Avatar" className="w-4 h-4 rounded-full object-cover shrink-0" />
            ) : (
              <span className="text-sm leading-none">{userProfile?.avatar || "🧠"}</span>
            )}
            <span className="text-[10px] font-mono font-semibold">Profile</span>
          </button>
        </div>
      </nav>

      {/* ========================================================= */}
      {/* Modal 3: First-time User Induction Tutorial or Manual Tour */}
      {/* ========================================================= */}
      {(showTutorialManualModal || (userProfile && userProfile.tutorialCompleted !== true)) && (
        <InteractiveTutorial 
          userProfile={userProfile || {
            userId: user.uid,
            name: user.displayName || "Operator",
            email: user.email || "",
            role: "AI Workspace Operator",
            avatar: "🧠",
            trustedOperator: true,
            tutorialCompleted: true
          }} 
          onComplete={() => {
            setShowTutorialManualModal(false);
            if (user) {
              try {
                localStorage.setItem(`nexus_tutorial_completed_${user.uid}`, "true");
              } catch (e) {
                // Ignore storage errors
              }
            }
            setUserProfile(prev => prev ? { ...prev, tutorialCompleted: true } : null);
          }} 
        />
      )}
    </div>
  );
}
