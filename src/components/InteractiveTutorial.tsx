import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { doc, updateDoc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { UserProfileData } from "./UserProfilePage";
import { Sparkles, ArrowRight, Terminal, User, FileText, CheckCircle2 } from "lucide-react";

interface InteractiveTutorialProps {
  userProfile: UserProfileData;
  onComplete: () => void;
}

export default function InteractiveTutorial({ userProfile, onComplete }: InteractiveTutorialProps) {
  const [step, setStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const steps = [
    {
      title: "Welcome to NEXUS/ONE",
      description: "You have been authorized as a confirmed operator. This terminal provides a secure environment to run intelligent multi-agent tasks, manage cognitive personas, and monitor system processes.",
      icon: <Terminal className="w-8 h-8 text-indigo-400" />
    },
    {
      title: "The Sandbox Workspace",
      description: "The core of your operations. Here you can execute complex natural language prompts which are processed into strict, staged execution loops. The workspace maintains an active filesystem and process list.",
      icon: <FileText className="w-8 h-8 text-cyan-400" />
    },
    {
      title: "Persona Forge",
      description: "Customize your AI companions! Toggle between different local LLM GGUF models directly within the Forge, and assign them different aesthetics, context windows, and temperatures.",
      icon: <User className="w-8 h-8 text-purple-400" />
    },
    {
      title: "System Watchdog",
      description: "NEXUS limits potentially dangerous loops through a strict Trust Index and safety clearances. Deletion operations must be manually verified. Keep your systems safe.",
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-400" />
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      finishTutorial();
    }
  };

  const finishTutorial = async () => {
    setIsCompleting(true);
    if (auth.currentUser) {
      try {
        localStorage.setItem(`nexus_tutorial_completed_${auth.currentUser.uid}`, "true");
      } catch (e) {
        // Ignore localStorage quota/private mode errors
      }
    }
    try {
      if (auth.currentUser) {
        const path = `users/${auth.currentUser.uid}`;
        const profileRef = doc(db, path);
        
        // Fetch current document first to determine if it exists
        const docSnap = await getDoc(profileRef);
        
        if (docSnap.exists()) {
          // Document exists: do a precise, minimal update conforming to update security rules
          const updatePayload: any = {
            tutorialCompleted: true,
            updatedAt: serverTimestamp()
          };
          if (auth.currentUser.email?.toLowerCase() === "gxqstudio@gmail.com") {
            updatePayload.trustedOperator = true;
          }
          await updateDoc(profileRef, updatePayload);
        } else {
          // Document does not exist: do a full set conforming to create security rules
          const createPayload = {
            userId: auth.currentUser.uid,
            name: userProfile.name || auth.currentUser.displayName || "Google Operator",
            email: userProfile.email || auth.currentUser.email || "unknown@operator.local",
            role: userProfile.role || "AI Workspace Operator",
            avatar: userProfile.avatar || "🧠",
            trustedOperator: auth.currentUser.email?.toLowerCase() === "gxqstudio@gmail.com",
            customGreeting: "Access Granted. Initializing Nexus Command Channels...",
            tutorialCompleted: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          await setDoc(profileRef, createPayload);
        }
      }
      onComplete();
    } catch (err) {
      console.error("Failed to complete tutorial state sync", err);
      try {
        if (auth.currentUser) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
        }
      } catch (wrapped) {
        // Continue anyway locally
      }
      onComplete(); // ensure they aren't blocked forever if update fails
    } finally {
      setIsCompleting(false);
    }
  };

  const currentStepInfo = steps[step];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        className="w-full max-w-lg bg-slate-900 border border-slate-700 shadow-2xl rounded-3xl overflow-hidden text-left flex flex-col"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="h-1 bg-slate-800 w-full relative">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-500" 
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
        
        <div className="p-8 flex flex-col gap-6">
          <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/50 shadow-inner">
              {currentStepInfo.icon}
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold text-indigo-400 tracking-widest uppercase mb-1">
                SYSTEM INDUCTION • STEP {step + 1}/{steps.length}
              </div>
              <h2 className="text-xl font-display font-bold text-white">
                {currentStepInfo.title}
              </h2>
            </div>
          </div>
          
          <div className="text-sm font-sans text-slate-300 leading-relaxed min-h-[80px]">
            {currentStepInfo.description}
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <button 
              onClick={() => finishTutorial()}
              disabled={isCompleting}
              className="text-xs font-sans font-semibold text-slate-500 hover:text-slate-300 transition"
            >
              Skip Induction
            </button>
            <button
              onClick={handleNext}
              disabled={isCompleting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-sans font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isCompleting ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{step === steps.length - 1 ? "Acknowledge & Begin" : "Next Module"}</span>
                  {step === steps.length - 1 ? <Sparkles className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
