import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { motion, AnimatePresence } from "motion/react";
import { User, Shield, Terminal, ArrowLeft, RefreshCw, Check, Sparkles, AlertCircle } from "lucide-react";

interface UserProfilePageProps {
  onBack: () => void;
  trustScore: number;
  filesCount: number;
}

export interface UserProfileData {
  userId: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  trustedOperator?: boolean;
  customGreeting?: string;
  tutorialCompleted?: boolean;
  createdAt?: any;
}

const getProfileDateString = (createdAt: any) => {
  if (!createdAt) return "RESOLVED SECURELY";
  if (typeof createdAt.toDate === "function") {
    return createdAt.toDate().toLocaleDateString();
  }
  if (createdAt.seconds) {
    return new Date(createdAt.seconds * 1000).toLocaleDateString();
  }
  try {
    return new Date(createdAt).toLocaleDateString();
  } catch (e) {
    return "RESOLVED SECURELY";
  }
};

export default function UserProfilePage({ onBack, trustScore, filesCount }: UserProfilePageProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form fields
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [avatar, setAvatar] = useState("🧠");
  const [customGreeting, setCustomGreeting] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const emojis = ["🧠", "🧙", "🦀", "⚡", "🛸", "🤖", "💼", "🌸", "🎯", "⚖️"];

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setIsLoading(true);
    setErrorMessage("");
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const path = `users/${currentUser.uid}`;
    try {
      const docSnap = await getDoc(doc(db, "users", currentUser.uid));
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfileData;
        setProfile(data);
        setName(data.name || "");
        setRole(data.role || "AI Operational Operator");
        setAvatar(data.avatar || "🧠");
        setCustomGreeting(data.customGreeting || "");
      } else {
        // Fallback or self-heal document if Firestore triggers offline
        const mockProfile: UserProfileData = {
          userId: currentUser.uid,
          name: currentUser.displayName || "Nexus Operator",
          email: currentUser.email || "operator@nexus.one",
          role: "NEXUS/ONE Pilot",
          avatar: "🧠",
          customGreeting: "Standby... Channels connecting.",
          createdAt: new Date().toISOString()
        };
        setProfile(mockProfile);
        setName(mockProfile.name);
        setRole(mockProfile.role);
        setAvatar(mockProfile.avatar);
        setCustomGreeting(mockProfile.customGreeting || "");
      }
    } catch (err: any) {
      console.error("Failed to read user document profile from database:", err);
      // Ensure required handleFirestoreError is triggered as per skill instructions
      try {
        handleFirestoreError(err, OperationType.GET, path);
      } catch (wrappedErr: any) {
        setErrorMessage("Clearance Error: Failed to resolve operator document from secure node.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSaving(true);
    setIsSuccess(false);

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const path = `users/${currentUser.uid}`;
    try {
      const profileRef = doc(db, "users", currentUser.uid);
      const updatePayload: any = {
        name: name.trim(),
        role: role.trim(),
        avatar,
        customGreeting: customGreeting.trim(),
        updatedAt: serverTimestamp()
      };

      if (currentUser.email?.toLowerCase() === "gxqstudio@gmail.com") {
        updatePayload.trustedOperator = true;
      }

      // updateDoc is highly secure; blocks shadow user roles
      await updateDoc(profileRef, updatePayload);

      const localProfileUpdate = { ...updatePayload, updatedAt: new Date().toISOString() };
      setProfile(prev => prev ? { ...prev, ...localProfileUpdate } : null);
      setIsSuccess(true);
      setIsEditing(false);
      
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Failed to save changes to Firestore user document:", err);
      try {
        handleFirestoreError(err, OperationType.UPDATE, path);
      } catch (wrappedErr: any) {
        setErrorMessage("Identity Refused: The security rules rejected edits to this profile block.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 relative sm:py-12 select-none" id="operator-profile-page">
      {/* Background glow loops */}
      <div className="absolute top-1/4 left-1/2 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -translate-x-1/2 pointer-events-none" />

      {/* Navigation action bar */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer bg-slate-900 border border-slate-800 rounded-xl px-4 py-2"
          id="back-launcher-profile-btn"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Launchpad</span>
        </button>

        <span className="text-[10px] font-mono font-medium text-indigo-400 uppercase tracking-widest">
          Operator Console // #{profile?.userId?.substring(0, 8).toUpperCase() || "RESOLVING"}
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-400 font-mono">RESOLVING SECURITY CLEARANCE OVERLAYS...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main profile layout card */}
          <div className="bg-slate-900/40 border border-slate-850 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row gap-6 items-start justify-between relative z-10">
              
              {/* Profile Bio Details */}
              <div className="flex gap-4 items-center">
                <span className="text-5xl shrink-0 p-3 bg-slate-950 border border-slate-800 rounded-2xl select-none filter drop-shadow-[0_4px_10px_rgba(99,102,241,0.25)]">
                  {profile?.avatar || "🧠"}
                </span>
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                      {profile?.name}
                    </h2>
                    {profile?.trustedOperator && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 font-semibold px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3 stroke-[3px]" />
                        <span>VERIFIED CAPTAIN</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-cyan-400 uppercase tracking-wide mt-1">
                    {profile?.role}
                  </p>
                  <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                    Clearance Account Channels: <span className="text-slate-350">{profile?.email}</span>
                  </p>
                </div>
              </div>

              {/* Editing Activation Button */}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full md:w-auto px-5 py-2 hover:bg-indigo-600 bg-slate-800 text-white font-sans text-xs font-bold rounded-xl cursor-pointer hover:shadow-lg transition-all"
                  id="profile-toggle-edit-btn"
                >
                  Configure Hardware Profile
                </button>
              )}
            </div>

            {/* Sub-greeting banner line */}
            <div className="mt-8 pt-4 border-t border-slate-800/40 text-left">
              <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                Active Cognitive Slogan
              </span>
              <p className="font-mono text-xs text-indigo-300 italic mt-1 bg-slate-950/40 p-3.5 border border-slate-850/60 rounded-xl leading-relaxed">
                "{profile?.customGreeting || "Automatic pilot active."}"
              </p>
            </div>
          </div>

          {/* Form edit fields container */}
          <AnimatePresence mode="wait">
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form
                  onSubmit={handleSave}
                  className="bg-slate-900/60 border border-indigo-500/25 rounded-3xl p-6 md:p-8 space-y-4 text-left shadow-2xl relative"
                >
                  <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-widest block">
                    Rewrite Operator Directives
                  </span>

                  {errorMessage && (
                    <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex gap-2 items-center text-red-400 text-xs font-mono">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Avatar Select */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs text-slate-400 font-display block">Cognitive Avatar symbol</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setAvatar(emoji)}
                          className={`text-xl p-2 rounded-xl border cursor-pointer transition ${
                            avatar === emoji
                              ? "border-indigo-500 bg-indigo-950/40"
                              : "border-slate-800 hover:bg-slate-800"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Edit Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-550 block">OPERATOR REGISTERED NAME</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ada Lovelace"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/40 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                      required
                    />
                  </div>

                  {/* Edit Role */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-555 block">SYSTEM CLASSIFIED ROLE</label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Compiler Watchdog Advisor"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/40 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                      required
                    />
                  </div>

                  {/* Edit Custom Slogan */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-557 block">COGNITIVE STARTUP GREETING SLOGAN</label>
                    <textarea
                      value={customGreeting}
                      onChange={(e) => setCustomGreeting(e.target.value)}
                      placeholder="A personal system greeting, quote, or slogan"
                      className="w-full h-16 bg-slate-950 border border-slate-800 focus:border-indigo-500/40 rounded-xl p-2.5 text-xs text-white focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  {/* Decisions */}
                  <div className="flex gap-2 justify-end pt-4 border-t border-slate-800/50">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setErrorMessage("");
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans text-xs rounded-xl cursor-pointer"
                    >
                      Cancel Re-configuration
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-sans text-xs font-bold rounded-xl cursor-pointer flex gap-1.5 items-center disabled:opacity-40"
                      id="save-profile-btn"
                    >
                      {isSaving ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Flush Specs to Core</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core Telemetry & Application Specific Data Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            {/* Sync telemetry info */}
            <div className="bg-slate-900/45 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Terminal className="text-cyan-400 w-4.5 h-4.5" />
                  <span className="font-display font-bold text-xs text-white uppercase tracking-wider">
                    OS Workspace Telemetry
                  </span>
                </div>
                <div className="space-y-2.5 font-mono text-[11px] text-slate-400 leading-normal">
                  <div className="flex justify-between border-b border-slate-800/40 pb-1.5">
                    <span>INDEXED PATHS</span>
                    <span className="text-white">{filesCount} Node Objects</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/40 pb-1.5">
                    <span>SECURITY ACCREDITATION</span>
                    <span className="text-indigo-400 font-semibold">{profile?.trustedOperator ? "LEVEL 3 SUPERVISOR" : "LEVEL 1 OPERATOR"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/40 pb-1.5">
                    <span>SANDBOX TARGET</span>
                    <span className="text-white">C:\Users\NexusUser\Desktop</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CREATED AT</span>
                    <span className="text-white">
                      {getProfileDateString(profile?.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Watchdog audit metrics */}
            <div className="bg-slate-900/45 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="text-indigo-400 w-4.5 h-4.5" />
                  <span className="font-display font-bold text-xs text-white uppercase tracking-wider">
                    Watchdog Audit Trust Index
                  </span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed font-sans mb-3 text-justify">
                  Continuous validation loops monitor process changes and puppeteer steps. Cleared operations increment operator reliability metrics dynamically.
                </p>

                <div className="space-y-1 mt-4">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-500 uppercase">System Trust Margin</span>
                    <span className="text-emerald-400 font-bold">{(trustScore * 100).toFixed(0)}% Clear Accuracy</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                    <div
                      className="bg-gradient-to-r from-red-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${trustScore * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success alert toast */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            className="fixed bottom-6 right-6 bg-emerald-500 text-slate-950 text-xs font-mono font-bold py-3.5 px-5 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-400/20 backdrop-blur-md z-50"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            id="profile-save-toast"
          >
            <Check className="w-4 h-4 stroke-[3px]" />
            <span>OPERATOR DIRECTIVES MODIFIED SUCCESSFUL</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
