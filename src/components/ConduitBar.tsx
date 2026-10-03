import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Mic, 
  Volume2, 
  ShieldCheck, 
  Heart, 
  Sliders, 
  Trash2, 
  RotateCcw, 
  Camera, 
  Loader2, 
  Download, 
  FileJson, 
  Copy, 
  Save, 
  Database, 
  Calendar, 
  X, 
  Check 
} from "lucide-react";
import { Persona, MockFile, ProcessItem, AuditLog } from "../types";

interface ConduitBarProps {
  activePersona: Persona;
  onChangePersona: () => void;
  onExecutePrompt: (prompt: string) => void;
  isLoading: boolean;
  trustScore: number;
  files: MockFile[];
  processes: ProcessItem[];
  auditLogs: AuditLog[];
  onRestoreSnapshot?: (files: MockFile[], processes: ProcessItem[], auditLogs: AuditLog[]) => void;
}

interface SavedSnapshot {
  id: string;
  name: string;
  timestamp: string;
  filesCount: number;
  processesCount: number;
  logsCount: number;
  payload: {
    files: MockFile[];
    processes: ProcessItem[];
    auditLogs: AuditLog[];
  };
}

export default function ConduitBar({
  activePersona,
  onChangePersona,
  onExecutePrompt,
  isLoading,
  trustScore,
  files,
  processes,
  auditLogs,
  onRestoreSnapshot
}: ConduitBarProps) {
  const [inputValue, setInputValue] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Snapshot Panel Modal State
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotName, setSnapshotName] = useState("");
  const [savedSnapshots, setSavedSnapshots] = useState<SavedSnapshot[]>([]);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Load saved snapshots on mount
  useEffect(() => {
    const loaded = localStorage.getItem("nexus_saved_snapshots");
    if (loaded) {
      try {
        setSavedSnapshots(JSON.parse(loaded));
      } catch (e) {
        console.error("Failed to load saved snapshots:", e);
      }
    }
  }, []);

  const saveSnapshotsToStore = (list: SavedSnapshot[]) => {
    setSavedSnapshots(list);
    localStorage.setItem("nexus_saved_snapshots", JSON.stringify(list));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    onExecutePrompt(inputValue);
    setInputValue("");
  };

  const handleQuickAction = async (actionKey: string, promptText: string) => {
    setActiveAction(actionKey);
    setSuccessMessage(null);
    
    // Simulate high-contrast cybernetic signal delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    onExecutePrompt(promptText);
    
    setActiveAction(null);
    setSuccessMessage(`${actionKey} sequence activated successfully!`);
    
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3500);
  };

  // Capture current state JSON
  const captureCurrentPayload = () => {
    return {
      files,
      processes,
      auditLogs,
      capturedAt: new Date().toISOString(),
      trustScore
    };
  };

  // Action: Trigger instant download of JSON file
  const triggerDownload = (nameOverride?: string, payloadOverride?: any) => {
    const data = payloadOverride || captureCurrentPayload();
    const filename = `nexus-workspace-${(nameOverride || "snapshot").toLowerCase().replace(/[^a-z0-9]/g, "-")}-${new Date().toISOString().split("T")[0]}.json`;
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccessMessage("JSON snapshot downloaded successfully!");
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Action: Copy JSON string directly to clipboard
  const copyJsonToClipboard = () => {
    const data = captureCurrentPayload();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  // Action: Store Snapshot inside local Profile Vault
  const handleStoreSnapshot = () => {
    const name = snapshotName.trim() || `Workspace Backup #${savedSnapshots.length + 1}`;
    const newSnap: SavedSnapshot = {
      id: "snap_" + Math.random().toString(36).substr(2, 9),
      name,
      timestamp: new Date().toLocaleTimeString() + " " + new Date().toLocaleDateString(),
      filesCount: files.length,
      processesCount: processes.length,
      logsCount: auditLogs.length,
      payload: {
        files: [...files],
        processes: [...processes],
        auditLogs: [...auditLogs]
      }
    };

    const updated = [newSnap, ...savedSnapshots];
    saveSnapshotsToStore(updated);
    setSnapshotName("");
    setSuccessMessage(`Stored "${name}" in profile vault!`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Action: Restore selected snapshot
  const handleRestore = (snap: SavedSnapshot) => {
    if (onRestoreSnapshot) {
      onRestoreSnapshot(snap.payload.files, snap.payload.processes, snap.payload.auditLogs);
      setSuccessMessage(`Restored workspace from "${snap.name}"!`);
      setShowSnapshotModal(false);
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  // Action: Delete selected snapshot from vault
  const handleDeleteSnapshot = (id: string, name: string) => {
    const updated = savedSnapshots.filter(s => s.id !== id);
    saveSnapshotsToStore(updated);
    setSuccessMessage(`Deleted "${name}" from vault.`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-40 select-none flex flex-col gap-2.5">
      
      {/* Quick Actions Row */}
      <motion.div
        className="glass-panel-neon bg-slate-950/80 border border-slate-800/80 rounded-2xl p-2 px-3.5 flex items-center justify-between backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] relative overflow-hidden"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {/* Glow Line effect inside top margin */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 via-cyan-400 to-yellow-400 opacity-60" />

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-mono font-extrabold text-slate-500 uppercase tracking-widest px-2 py-1 bg-slate-900/60 rounded-lg border border-slate-800/50">
            QUICK ACTIONS:
          </span>

          {/* Action 1: Clear Cache */}
          <button
            onClick={() => handleQuickAction("Clear Cache", "Purge database, clear sandbox cache, and flush memory channels")}
            disabled={isLoading || !!activeAction}
            className="group px-2.5 py-1.5 bg-yellow-950/10 hover:bg-yellow-950/30 border border-yellow-500/20 hover:border-yellow-400 rounded-xl text-yellow-300 hover:text-yellow-200 transition-all duration-300 flex items-center gap-1.5 text-[11px] font-mono font-medium cursor-pointer hover:shadow-[0_0_12px_rgba(234,179,8,0.25)] active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            title="Clear Cache & Flush Memory"
          >
            {activeAction === "Clear Cache" ? (
              <Loader2 className="w-3 h-3 animate-spin text-yellow-400" />
            ) : (
              <Trash2 className="w-3 h-3 text-yellow-500 group-hover:rotate-12 transition-transform" />
            )}
            <span>Clear Cache</span>
          </button>

          {/* Action 2: Restart Agent */}
          <button
            onClick={() => handleQuickAction("Restart Agent", "Restart AI cognitive safety daemon and hot-reload active settings")}
            disabled={isLoading || !!activeAction}
            className="group px-2.5 py-1.5 bg-purple-950/10 hover:bg-purple-950/30 border border-purple-500/20 hover:border-purple-400 rounded-xl text-purple-300 hover:text-purple-200 transition-all duration-300 flex items-center gap-1.5 text-[11px] font-mono font-medium cursor-pointer hover:shadow-[0_0_12px_rgba(168,85,247,0.25)] active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            title="Restart Active AI safety agent daemon"
          >
            {activeAction === "Restart Agent" ? (
              <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
            ) : (
              <RotateCcw className="w-3 h-3 text-purple-400 group-hover:rotate-45 transition-transform" />
            )}
            <span>Restart Agent</span>
          </button>

          {/* Action 3: Open Snapshot Deck */}
          <button
            onClick={() => setShowSnapshotModal(true)}
            className="group px-2.5 py-1.5 bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 rounded-xl text-cyan-300 hover:text-cyan-200 transition-all duration-300 flex items-center gap-1.5 text-[11px] font-mono font-medium cursor-pointer hover:shadow-[0_0_15px_rgba(6,182,212,0.35)] active:scale-95"
            title="Snapshot current workspace metrics and payloads"
          >
            <Camera className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Snapshot Workspace</span>
          </button>
        </div>

        {/* Action Feedbacks Status toast */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 rounded-lg px-2.5 py-1 animate-pulse"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Main Conduit Bar */}
      <motion.div
        className="glass-panel-neon bg-slate-950/75 border border-indigo-500/20 shadow-[0_15px_50px_-15px_rgba(30,41,59,0.9)] rounded-3xl h-20 px-4 sm:px-6 flex items-center justify-between backdrop-blur-2xl relative"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        {/* Left Side: Avatar selector trigger */}
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onChangePersona}
            className="group relative flex items-center justify-center w-11 h-11 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 hover:from-cyan-500/20 hover:to-indigo-500/20 border border-indigo-500/20 hover:border-cyan-400/50 rounded-2xl cursor-pointer transition-all duration-300 active:scale-95"
            whileHover={{ y: -2 }}
            title="Configure Active AI Companion"
            id="avatar-persona-trigger"
          >
            <div className="text-2xl filter drop-shadow-[0_2px_8px_rgba(99,102,241,0.5)]">
              {activePersona.avatar}
            </div>
            
            {/* Pulsing indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </motion.button>

          {/* Persona quick meta */}
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-white tracking-wide font-display">
              {activePersona.name}
            </p>
            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
              <span>{activePersona.role.split(" & ")[0]}</span>
            </p>
          </div>
        </div>

        {/* Center: Command Formulation core */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-xl mx-4 sm:mx-6 h-12 relative flex items-center">
          <div className="relative w-full flex items-center bg-slate-900/40 border border-slate-800 focus-within:border-cyan-500/40 rounded-xl px-3 transition duration-300">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Command ${activePersona.name.split(" ")[0]}... (Ctrl+Shift+N)`}
              className="w-full bg-transparent text-white text-xs sm:text-sm focus:outline-none placeholder:text-slate-500 h-10 border-none font-sans"
              disabled={isLoading}
              id="conduit-command-input"
            />
            {inputValue.trim() && (
              <button
                type="submit"
                disabled={isLoading}
                className="text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer pr-1 transition"
                id="conduit-exec"
              >
                EXEC
              </button>
            )}
          </div>
        </form>

        {/* Right Side: Environment Status telemetry */}
        <div className="flex items-center gap-4">
          {/* Trust Score */}
          <div className="hidden md:flex flex-col items-end select-none">
            <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Safety Trust</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-slate-200 font-mono font-semibold">
                {(trustScore * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="w-[1px] h-8 bg-slate-800 hidden md:block" />

          {/* Quick loop command triggers panel */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onChangePersona}
              className="p-2 bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              title="Custom Prompts Forge"
              id="toggle-forge"
            >
              <Sliders className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => onExecutePrompt("Synthesize pitch: Welcome to NEXUS ONE. No Tabs. No Limits.")}
              className="p-2 bg-slate-900/50 hover:bg-cyan-950 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/30 rounded-xl text-slate-400 transition cursor-pointer"
              title="Click to Synthesize Voice Output"
              id="voice-synthesis-trigger"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Snapshot Deck modal panel */}
      <AnimatePresence>
        {showSnapshotModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-slate-900/95 border border-cyan-500/30 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.15)] relative max-h-[90vh] flex flex-col"
            >
              {/* Glow border light inside top margin */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500" />

              {/* Title Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-cyan-950/40 text-cyan-400 rounded-xl border border-cyan-500/20">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-white">WORKSPACE COGNITIVE SNAPSHOTS</h3>
                    <p className="text-[10px] text-slate-400 font-mono uppercase">Serialize and capture deck logs, active processes, and files</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSnapshotModal(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body Content with custom dual scroll design */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* Section 1: Create snapshot panel */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                    Generate New System State
                  </h4>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl">
                      <div className="text-lg sm:text-xl font-bold font-mono text-white">{files.length}</div>
                      <div className="text-[9px] font-mono text-slate-500 uppercase">Files</div>
                    </div>
                    <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl">
                      <div className="text-lg sm:text-xl font-bold font-mono text-white">{processes.length}</div>
                      <div className="text-[9px] font-mono text-slate-500 uppercase">Processes</div>
                    </div>
                    <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl">
                      <div className="text-lg sm:text-xl font-bold font-mono text-white">{auditLogs.length}</div>
                      <div className="text-[9px] font-mono text-slate-500 uppercase">Logs</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1">
                      Snapshot Identity (Name)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Master backup, stable recovery stack..."
                      value={snapshotName}
                      onChange={(e) => setSnapshotName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/30 rounded-xl px-3 py-2 text-xs font-sans text-white focus:outline-none transition shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={handleStoreSnapshot}
                      className="flex-1 min-w-[140px] py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-sans font-bold text-xs rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Store in Profile Vault</span>
                    </button>
                    <button
                      onClick={() => triggerDownload(snapshotName)}
                      className="py-2 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-cyan-400 hover:text-white font-sans font-semibold text-xs rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download JSON</span>
                    </button>
                    <button
                      onClick={copyJsonToClipboard}
                      className="py-2 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-purple-400 hover:text-white font-sans font-semibold text-xs rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
                    >
                      {copiedToClipboard ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedToClipboard ? "Copied!" : "Copy Clipboard"}</span>
                    </button>
                  </div>
                </div>

                {/* Section 2: Previous backups lists */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-purple-400" />
                    <span>Profile Vault Archive ({savedSnapshots.length})</span>
                  </h4>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {savedSnapshots.map((snap) => (
                      <div
                        key={snap.id}
                        className="p-3 bg-slate-950/40 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-4 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-950/40 border border-purple-500/10 text-purple-400 rounded-lg">
                            <FileJson className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white font-sans">{snap.name}</div>
                            <div className="text-[9px] font-mono text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                <span>{snap.timestamp}</span>
                              </span>
                              <span>•</span>
                              <span>F: {snap.filesCount} | P: {snap.processesCount} | L: {snap.logsCount}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onRestoreSnapshot && (
                            <button
                              onClick={() => handleRestore(snap)}
                              className="px-2 py-1 bg-emerald-950/20 hover:bg-emerald-950/50 border border-emerald-500/20 hover:border-emerald-500/50 rounded-lg text-[10px] font-mono font-bold text-emerald-400 hover:text-white cursor-pointer transition flex items-center gap-1"
                              title="Restore entire environment to this state"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Restore</span>
                            </button>
                          )}
                          <button
                            onClick={() => triggerDownload(snap.name, snap.payload)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg cursor-pointer transition"
                            title="Download JSON File"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSnapshot(snap.id, snap.name)}
                            className="p-1.5 bg-slate-900 hover:bg-red-950/50 border border-slate-800 hover:border-red-500/30 text-slate-500 hover:text-red-400 rounded-lg cursor-pointer transition"
                            title="Delete Snapshot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {savedSnapshots.length === 0 && (
                      <div className="text-xs text-slate-500 font-sans italic text-center py-6 border border-dashed border-slate-800 rounded-2xl bg-slate-950/10">
                        No stored snapshots found in your local profile vault.
                      </div>
                    )}
                  </div>
                </div>

              </div>
              
              {/* Footer */}
              <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-center">
                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  SECURED VIA INTEGRATED COCKPIT RECOVERY CHANNELS
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
