import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Folder, FileText, Cpu, Trash2, ArrowRight, CornerDownRight, Plus,
  Maximize2, Volume2, Shield, User, HelpCircle, HardDrive, Play,
  RefreshCw, CheckCircle, Clock, AlertTriangle, ChevronRight, Binary, Search,
  TrendingUp, Activity
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
import { MockFile, ProcessItem, AuditLog, Persona, PuppetPlan, PuppetStep } from "../types";

interface CanvasWorkspaceProps {
  files: MockFile[];
  processes: ProcessItem[];
  auditLogs: AuditLog[];
  personas: Persona[];
  activePersona: Persona;
  onChangeFiles: (updatedFiles: MockFile[]) => void;
  onChangeProcesses: (updatedProcesses: ProcessItem[]) => void;
  onExecutePrompt: (prompt: string) => void;
  activePlan: PuppetPlan | null;
  isLoading: boolean;
  onClearPlan: () => void;
}

export default function CanvasWorkspace({
  files,
  processes,
  auditLogs,
  personas,
  activePersona,
  onChangeFiles,
  onChangeProcesses,
  onExecutePrompt,
  activePlan,
  isLoading,
  onClearPlan
}: CanvasWorkspaceProps) {
  // Navigation folders inside Sandbox File Explorer
  const [currentFolder, setCurrentFolder] = useState<string>("C:\\Users\\NexusUser\\Desktop");
  const [searchQuery, setSearchQuery] = useState("");

  // Global search filtering logic across files, processes, and audit logs
  const getFilteredResults = () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return { files: [], processes: [], auditLogs: [] };

    const filteredFiles = files.filter(
      (f) => f.name.toLowerCase().includes(query) || f.path.toLowerCase().includes(query)
    );

    const filteredProcesses = processes.filter(
      (p) => p.name.toLowerCase().includes(query) || p.pid.toString().includes(query)
    );

    const filteredLogs = auditLogs.filter(
      (log) =>
        log.instruction.toLowerCase().includes(query) ||
        (log.steps &&
          log.steps.some(
            (step) =>
              step.action.toLowerCase().includes(query) ||
              step.target.toLowerCase().includes(query) ||
              (step.details && step.details.toLowerCase().includes(query))
          ))
    );

    return {
      files: filteredFiles.slice(0, 5),      // Limit to top 5 matches
      processes: filteredProcesses.slice(0, 5),
      auditLogs: filteredLogs.slice(0, 5)
    };
  };

  const filteredResults = getFilteredResults();
  const [explorerZoom, setExplorerZoom] = useState<number>(1);
  const [selectedFile, setSelectedFile] = useState<MockFile | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [newFileContent, setNewFileContent] = useState("");
  const [showNewFileModal, setShowNewFileModal] = useState(false);

  // Deep research compiled file toggle
  const [activeResearchReport, setActiveResearchReport] = useState<string | null>(null);

  // Speech and synthesizer state
  const [synthText, setSynthText] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  
  // Puppeteer cursor simulation state
  const [cursorPos, setCursorPos] = useState({ x: 150, y: 150 });
  const [cursorLabel, setCursorLabel] = useState<string | null>(null);
  const [isAnimatingCursor, setIsAnimatingCursor] = useState(false);
  const [runnerLog, setRunnerLog] = useState<string[]>([]);
  const screenRef = useRef<HTMLDivElement>(null);

  // Drag-and-drop state
  const [isDraggingOverCanvas, setIsDraggingOverCanvas] = useState(false);

  // Floating Window Open statuses and positions
  const [windows, setWindows] = useState({
    explorer: { open: true, x: 40, y: 40, zIndex: 10 },
    puppetScreen: { open: true, x: 620, y: 40, zIndex: 11 },
    watchdog: { open: true, x: 40, y: 440, zIndex: 8 },
    research: { open: false, x: 500, y: 350, zIndex: 9 },
    creativeSynth: { open: false, x: 300, y: 150, zIndex: 12 },
    taskTrend: { open: true, x: 620, y: 440, zIndex: 13 },
    systemHealth: { open: true, x: 340, y: 200, zIndex: 14 }
  });

  const [topZ, setTopZ] = useState(15);

  const [healthData, setHealthData] = useState<{time: string, cpu: number, memory: number}[]>(() => {
    return Array.from({length: 15}).map((_, i) => ({
      time: new Date(Date.now() - (15 - i) * 2000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
      cpu: Math.floor(Math.random() * 20) + 10,
      memory: Math.floor(Math.random() * 300) + 500,
    }));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setHealthData(prev => {
        const next = [...prev.slice(1)];
        let newCpu = prev[prev.length - 1].cpu + (Math.random() * 15 - 7.5);
        let newMem = prev[prev.length - 1].memory + (Math.random() * 100 - 50);
        
        const runningAgents = processes.filter(p => p.status === 'Running').length;
        if (runningAgents > 0) {
           newCpu += runningAgents * 3;
           newMem += runningAgents * 40;
        }

        newCpu = Math.max(2, Math.min(newCpu, 98));
        newMem = Math.max(200, Math.min(newMem, 2048));
        
        next.push({
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
          cpu: Math.round(newCpu),
          memory: Math.round(newMem)
        });
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [processes]);

  const bringToFront = (winId: keyof typeof windows) => {
    const nextZ = topZ + 1;
    setTopZ(nextZ);
    setWindows((prev) => ({
      ...prev,
      [winId]: { ...prev[winId], zIndex: nextZ }
    }));
  };

  const toggleWindow = (winId: keyof typeof windows) => {
    setWindows((prev) => ({
      ...prev,
      [winId]: { ...prev[winId], open: !prev[winId].open }
    }));
  };

  const getChartData = () => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const yymmddStr = d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, '0') + "-" + String(d.getUTCDate()).padStart(2, '0');

      // filter logs for this day
      const dailyLogs = auditLogs.filter(log => {
        if (!log.timestamp) return false;
        try {
          const logDate = new Date(log.timestamp);
          const logYymmdd = logDate.getUTCFullYear() + "-" + String(logDate.getUTCMonth() + 1).padStart(2, '0') + "-" + String(logDate.getUTCDate()).padStart(2, '0');
          return logYymmdd === yymmddStr;
        } catch (e) {
          return false;
        }
      });

      const totalSteps = dailyLogs.reduce((sum, log) => sum + (log.steps?.length || 0), 0);
      const successes = dailyLogs.filter(l => l.success !== false).length;

      data.push({
        date: dateStr,
        tasks: dailyLogs.length,
        steps: totalSteps,
        successRate: dailyLogs.length > 0 ? Math.round((successes / dailyLogs.length) * 100) : 100
      });
    }
    return data;
  };

  // Directories structure helper
  const directoriesList = [
    { name: "Desktop", path: "C:\\Users\\NexusUser\\Desktop" },
    { name: "Downloads", path: "C:\\Users\\NexusUser\\Downloads" },
    { name: "Documents", path: "C:\\Users\\NexusUser\\Documents" },
    { name: "Pictures", path: "C:\\Users\\NexusUser\\Pictures" }
  ];

  // Filters files based on path
  const currentFolderFiles = files.filter((f) => {
    const folderWithSlash = currentFolder + "\\";
    // Checks if the file path is directly inside this folder (no sub-folders of sub-folders display unless double clicked)
    return f.path.startsWith(folderWithSlash) && f.path.substring(folderWithSlash.length).indexOf("\\") === -1;
  });

  // Watch for incoming puppet automation plans and trigger cursor visual animations!
  useEffect(() => {
    if (activePlan && activePlan.steps && activePlan.steps.length > 0) {
      runCursorSimulation(activePlan);
    }
  }, [activePlan]);

  // Bezier and linear pointer interpolation simulation
  const runCursorSimulation = async (plan: PuppetPlan) => {
    if (isAnimatingCursor) return;
    setIsAnimatingCursor(true);
    setRunnerLog([]);

    // Map plan actions onto specific coordinate targets inside the virtual puppet screen
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      setRunnerLog((p) => [...p, `Executing Node [${i + 1}]: ${step.action} -> ${step.target}`]);
      
      let targetX = 150;
      let targetY = 150;

      // Assign approximate sandbox pixel coordinate vectors based on instruction targets
      if (step.action === "MouseMove" || step.action === "MouseClick" || step.action === "FindAndClick") {
        const destStr = step.target.toLowerCase();
        if (destStr.includes("download")) {
          targetX = 64; targetY = 120;
        } else if (destStr.includes("document") || destStr.includes("docx") || destStr.includes("xlsx")) {
          targetX = 180; targetY = 220;
        } else if (destStr.includes("picture") || destStr.includes("png") || destStr.includes("jpg")) {
          targetX = 300; targetY = 100;
        } else if (destStr.includes("todo") || destStr.includes("txt")) {
          targetX = 80; targetY = 250;
        } else {
          targetX = Math.floor(Math.random() * 200) + 120;
          targetY = Math.floor(Math.random() * 150) + 100;
        }

        setCursorLabel(step.action === "MouseClick" || step.action === "FindAndClick" ? "CLICKING" : "SCANNING");
        
        // Bezier step-by-step frame transition
        const duration = 24; // frames
        const startX = cursorPos.x;
        const startY = cursorPos.y;

        for (let frame = 0; frame <= duration; frame++) {
          const t = frame / duration;
          // Smooth ease in out interpolation
          const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          const currX = startX + (targetX - startX) * easeT;
          const currY = startY + (targetY - startY) * easeT;
          setCursorPos({ x: currX, y: currY });
          await new Promise((r) => setTimeout(r, 10)); // ~60fps smooth loop
        }
        
        // Flash indicator on click
        await new Promise((r) => setTimeout(r, 150));
        setCursorLabel(null);
      } else if (step.action === "KeyboardType") {
        setCursorLabel("TYPING");
        await new Promise((r) => setTimeout(r, 600));
        setCursorLabel(null);
      } else if (step.action === "FileOperation") {
        setCursorLabel("IO FLUSH");
        await new Promise((r) => setTimeout(r, 400));
        setCursorLabel(null);
      }
    }

    setRunnerLog((p) => [...p, `✔ Puppeteer Loop complete. Host file indexes updated.`]);
    setIsAnimatingCursor(false);
    
    // Automatically open explorer or relevant window to show the changes!
    const testDestStr = plan.steps.map(s => s.target.toLowerCase()).join(" ");
    if (testDestStr.includes("picture")) {
      setCurrentFolder("C:\\Users\\NexusUser\\Pictures");
    } else if (testDestStr.includes("document")) {
      setCurrentFolder("C:\\Users\\NexusUser\\Documents");
    } else if (testDestStr.includes("downloads")) {
      setCurrentFolder("C:\\Users\\NexusUser\\Downloads");
    }
  };

  // Drag-and-drop local file simulated uploader
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverCanvas(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOverCanvas(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverCanvas(false);
    
    // Scan items dropped
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // Create new file as "Downloads" item so they can organize it!
      const mockType = file.type.includes("image") ? "image" : file.name.endsWith(".xlsx") ? "spreadsheet" : "document";
      const uPath = `C:\\Users\\NexusUser\\Downloads\\${file.name}`;
      const duplicateIndex = files.findIndex(f => f.path.toLowerCase() === uPath.toLowerCase());
      let updatedFiles = [];
      if (duplicateIndex !== -1) {
        updatedFiles = [...files];
        updatedFiles[duplicateIndex] = {
          name: file.name,
          path: uPath,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          type: mockType,
          dateCreated: new Date().toISOString().split("T")[0]
        };
      } else {
        updatedFiles = [
          ...files,
          {
            name: file.name,
            path: uPath,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            type: mockType,
            dateCreated: new Date().toISOString().split("T")[0]
          }
        ];
      }
      onChangeFiles(updatedFiles);
      onExecutePrompt(`Organize downloaded file: ${file.name}`);
    }
  };

  // Handle process killing
  const killSimulatedProcess = (pid: number, name: string) => {
    const nextList = processes.filter((p) => p.pid !== pid);
    onChangeProcesses(nextList);
    // Add procedural audit log
    const auditStep = {
      action: "Kill Task",
      target: name,
      status: "Completed" as const,
      details: `Terminated PID ${pid} via System watchdogs.`
    };
    onExecutePrompt(`Audit task removal: Killed process ${name}`);
  };

  // Text synthesis to voice playback
  const synthesizeTextToSpeech = () => {
    if (!synthText.trim() || isSynthesizing) return;
    setIsSynthesizing(true);
    
    // Call synthesis API
    fetch("/api/synthesizer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: synthText })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.audio) {
          const audio = new Audio(data.audio);
          audio.play();
        } else if (data.fallbackWebSpeech || window.speechSynthesis) {
          // Use standard HTML5 Web Speech Synthesis API
          const utterance = new SpeechSynthesisUtterance(synthText);
          utterance.onend = () => setIsSynthesizing(false);
          window.speechSynthesis.speak(utterance);
        }
      })
      .catch(() => {
        // Simple client-fallback
        if (window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(synthText);
          window.speechSynthesis.speak(utterance);
        }
      })
      .finally(() => {
        setIsSynthesizing(false);
      });
  };

  // Handle manual file creation
  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    fetch("/api/fs/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        op: "create",
        name: newFileName,
        dest: currentFolder,
        content: newFileContent,
        type: newFileName.endsWith(".xlsx") ? "spreadsheet" : newFileName.endsWith(".png") || newFileName.endsWith(".jpg") ? "image" : "document"
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          onChangeFiles(data.files);
          setNewFileName("");
          setNewFileContent("");
          setShowNewFileModal(false);
        }
      });
  };

  // Delete simulated files
  const handleConfirmDelete = (filePath: string) => {
    fetch("/api/fs/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "delete", source: filePath })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          onChangeFiles(data.files);
          setSelectedFile(null);
        }
      });
  };

  // Check if a file is a Markdown report, open in dossier window
  const openFile = (file: MockFile) => {
    setSelectedFile(file);
    if (file.name.endsWith(".md") && file.content) {
      setActiveResearchReport(file.content);
      setWindows(prev => ({
        ...prev,
        research: { ...prev.research, open: true }
      }));
      bringToFront("research");
    }
  };

  return (
    <div
      className={`relative w-full h-[94vh] infinite-bg overflow-hidden select-none select-none ${
        isDraggingOverCanvas ? "bg-indigo-950/20" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      id="nexus-workspace-canvas"
    >
      {/* Small floating quick dashboard toggles */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-slate-950/80 border border-slate-800 p-1.5 rounded-2xl select-none backdrop-blur-md h-12">
        <span className="text-[10px] font-mono font-medium text-slate-500 uppercase px-2 select-none">
          Command Panel
        </span>
        <button
          onClick={() => toggleWindow("explorer")}
          className={`px-3 py-1 text-xs font-sans rounded-xl cursor-pointer select-none border transition-all ${
            windows.explorer.open
              ? "bg-indigo-600 border-indigo-400 text-white"
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
          }`}
          id="btn-toggle-explorer"
        >
          File Manager
        </button>
        <button
          onClick={() => toggleWindow("puppetScreen")}
          className={`px-3 py-1 text-xs font-sans rounded-xl cursor-pointer select-none border transition-all ${
            windows.puppetScreen.open
              ? "bg-indigo-600 border-indigo-400 text-white"
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
          }`}
          id="btn-toggle-puppet"
        >
          Puppet visualizer
        </button>
        <button
          onClick={() => toggleWindow("watchdog")}
          className={`px-3 py-1 text-xs font-sans rounded-xl cursor-pointer select-none border transition-all ${
            windows.watchdog.open
              ? "bg-indigo-600 border-indigo-400 text-white"
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
          }`}
          id="btn-toggle-watchdog"
        >
          Task Watchdog
        </button>
        <button
          onClick={() => toggleWindow("creativeSynth")}
          className={`px-3 py-1 text-xs font-sans rounded-xl cursor-pointer select-none border transition-all h-8 ${
            windows.creativeSynth.open
              ? "bg-indigo-600 border-indigo-400 text-white"
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
          }`}
          id="btn-toggle-creative"
        >
          Speech synthesizer
        </button>

        <button
          onClick={() => toggleWindow("taskTrend")}
          className={`px-3 py-1 text-xs font-sans rounded-xl cursor-pointer select-none border transition-all h-8 ${
            windows.taskTrend.open
              ? "bg-indigo-600 border-indigo-400 text-white"
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
          }`}
          id="btn-toggle-task-trend"
        >
          Task Analytics
        </button>

        <button
          onClick={() => toggleWindow("systemHealth")}
          className={`px-3 py-1 text-xs font-sans rounded-xl cursor-pointer select-none border transition-all h-8 ${
            windows.systemHealth.open
              ? "bg-emerald-600 border-emerald-400 text-white"
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
          }`}
          id="btn-toggle-system-health"
        >
          System Health
        </button>

        <div className="w-[1px] h-6 bg-slate-800 shrink-0" />

        {/* Global Search Interface */}
        <div className="relative flex items-center pr-2">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files, tasks, logs..."
            className="pl-8 pr-6 py-1 h-8 text-[11px] bg-slate-900 border border-slate-800 hover:bg-slate-950 focus:bg-slate-950 text-white placeholder-slate-500 rounded-xl outline-none w-36 focus:w-48 transition-all font-sans"
            id="global-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 px-1 text-[10px] font-mono text-slate-500 hover:text-white bg-slate-950 border border-slate-800 rounded cursor-pointer"
            >
              ×
            </button>
          )}

          {/* Search results overlay dropdown */}
          <AnimatePresence>
            {searchQuery.trim() !== "" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-10 right-0 w-80 max-h-[300px] bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl overflow-y-auto z-40 backdrop-blur-xl p-3 scrollbar-thin flex flex-col gap-3 text-left"
              >
                {filteredResults.files.length === 0 && filteredResults.processes.length === 0 && filteredResults.auditLogs.length === 0 ? (
                  <p className="text-[11px] text-slate-500 text-center py-4 font-mono">No matching records found</p>
                ) : (
                  <>
                    {/* Matching files */}
                    {filteredResults.files.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <div className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider mb-1 border-b border-cyan-400/10 pb-0.5">
                          Files ({filteredResults.files.length})
                        </div>
                        <div className="flex flex-col gap-1">
                          {filteredResults.files.map((file) => (
                            <button
                              key={file.path}
                              onClick={() => {
                                const lastSlash = file.path.lastIndexOf("\\");
                                if (lastSlash !== -1) {
                                  const folder = file.path.substring(0, lastSlash);
                                  setCurrentFolder(folder);
                                }
                                setWindows(prev => ({ ...prev, explorer: { ...prev.explorer, open: true } }));
                                openFile(file);
                                setSearchQuery("");
                              }}
                              className="w-full text-left p-1.5 hover:bg-slate-900 border border-transparent hover:border-slate-850 rounded-lg flex items-center justify-between text-[11px] transition gap-1.5 cursor-pointer"
                            >
                              <span className="text-slate-350 truncate">{file.name}</span>
                              <span className="text-[9px] text-slate-500 font-mono shrink-0 select-none">{file.size}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching tasks */}
                    {filteredResults.processes.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <div className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider mb-1 border-b border-emerald-400/10 pb-0.5">
                          Processes ({filteredResults.processes.length})
                        </div>
                        <div className="flex flex-col gap-1">
                          {filteredResults.processes.map((proc) => (
                            <button
                              key={proc.pid}
                              onClick={() => {
                                setWindows(prev => ({ ...prev, watchdog: { ...prev.watchdog, open: true } }));
                                bringToFront("watchdog");
                                setSearchQuery("");
                              }}
                              className="w-full text-left p-1.5 hover:bg-slate-900 border border-transparent hover:border-slate-850 rounded-lg flex items-center justify-between text-[11px] transition cursor-pointer"
                            >
                              <span className="text-slate-350">{proc.name}</span>
                              <span className="text-[9px] text-emerald-500 font-mono bg-emerald-950 px-1 py-0.5 rounded border border-emerald-900/30">PID {proc.pid}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching logs */}
                    {filteredResults.auditLogs.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <div className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-wider mb-1 border-b border-indigo-500/10 pb-0.5">
                          Audit Logs ({filteredResults.auditLogs.length})
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {filteredResults.auditLogs.map((log, index) => (
                            <div
                              key={index}
                              className="p-2 bg-slate-900/30 border border-slate-900 rounded-lg text-[10px] leading-relaxed text-slate-350"
                            >
                              <div className="flex justify-between font-mono text-[8px] text-indigo-400 mb-0.5">
                                <span className="truncate max-w-[150px]">{log.instruction}</span>
                                <span className={log.success ? "text-emerald-400" : "text-yellow-400"}>
                                  {log.success ? "Completed" : "Error"}
                                </span>
                              </div>
                              {log.steps && log.steps.length > 0 && (
                                <p className="text-slate-400 font-sans">{log.steps[0].details || log.steps[0].target}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating System-Status Indicator top-right */}
      <div className="absolute top-4 right-4 z-30 hidden md:flex items-center gap-3 bg-slate-950/70 border border-slate-800/80 px-4 py-2 rounded-2xl backdrop-blur-md select-none">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 uppercase select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Local LLM server (8765) Online</span>
        </div>
        <div className="w-[1px] h-4 bg-slate-800" />
        <div className="font-mono text-[11px] text-slate-400 select-none">
          DirectML CUDA Accelerated
        </div>
      </div>

      <AnimatePresence>
        {isDraggingOverCanvas && (
          <motion.div
            className="absolute inset-0 bg-indigo-950/60 z-50 flex flex-col items-center justify-center pointer-events-none select-none backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="p-8 bg-slate-950/90 border-2 border-dashed border-indigo-500 rounded-3xl text-center max-w-sm">
              <Folder className="w-16 h-16 text-indigo-400 mx-auto mb-4 animate-bounce" />
              <h2 className="text-xl font-display font-bold text-white mb-2">Simulated Drag & Drop</h2>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Drop your local documents, photos or sheets here to load them into the sandbox's <span className="font-mono text-cyan-400">Downloads</span> folder and trigger AI auto-alignment!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* Draggable Window 1: Sandbox Local File Explorer */}
      {/* ========================================================= */}
      {windows.explorer.open && (
        <motion.div
          drag
          dragMomentum={false}
          onDragStart={() => bringToFront("explorer")}
          className="absolute w-[560px] h-[380px] bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden glass-panel flex flex-col"
          style={{ x: windows.explorer.x, y: windows.explorer.y, zIndex: windows.explorer.zIndex }}
          id="window-file-explorer"
        >
          {/* Header Bar */}
          <div className="h-11 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 cursor-move select-none">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span className="font-display font-semibold text-xs text-slate-200">
                Nexus Explorer Sandbox
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowNewFileModal(true)}
                className="p-1.5 hover:bg-slate-800 hover:text-white text-slate-400 rounded-lg cursor-pointer"
                title="Create New Mock File"
                id="btn-explorer-create-file"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleWindow("explorer")}
                className="text-slate-400 hover:text-red-400 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                id="btn-explorer-close"
              >
                <Maximize2 className="w-3.5 h-3.5 scale-90" />
              </button>
            </div>
          </div>

          {/* Directory Navigation Address Bar */}
          <div className="h-10 bg-slate-950/70 border-b border-slate-800 flex items-center px-3 gap-2 text-xs">
            <span className="text-slate-500 font-mono select-none">Location:</span>
            <div className="flex-1 bg-slate-900 border border-slate-800 px-2.5 py-1 text-slate-300 font-mono rounded-lg overflow-hidden text-ellipsis whitespace-nowrap">
              {currentFolder}
            </div>
          </div>

          {/* Main Area: Sidebar left + File Panel right */}
          <div className="flex-1 flex overflow-hidden">
            {/* Folder Shortcuts Sidebar left */}
            <div className="w-40 border-r border-slate-800/80 bg-slate-950/40 p-2 flex flex-col gap-1 overflow-y-auto">
              {directoriesList.map((dir) => (
                <button
                  key={dir.path}
                  onClick={() => {
                    setCurrentFolder(dir.path);
                    setSelectedFile(null);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg cursor-pointer text-xs font-sans transition-all flex items-center gap-2 ${
                    currentFolder === dir.path
                      ? "bg-indigo-600/20 text-indigo-200 font-medium border border-indigo-500/20"
                      : "text-slate-400 hover:bg-slate-900/60 hover:text-white"
                  }`}
                  id={`dir-tab-${dir.name.toLowerCase()}`}
                >
                  <Folder className={`w-3.5 h-3.5 ${currentFolder === dir.path ? "text-indigo-400" : "text-slate-500"}`} />
                  <span>{dir.name}</span>
                </button>
              ))}
            </div>

            {/* Folder contents panel right */}
            <div className="flex-1 p-3 overflow-y-auto grid grid-cols-3 gap-3 content-start relative">
              {currentFolderFiles.length === 0 ? (
                <div className="col-span-3 py-20 text-center select-none pointer-events-none">
                  <Folder className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-sans">Directories empty</p>
                </div>
              ) : (
                currentFolderFiles.map((file) => (
                  <div
                    key={file.path}
                    onClick={() => openFile(file)}
                    className={`p-3 bg-slate-900/30 hover:bg-slate-900/80 border rounded-xl cursor-pointer text-center relative group transition ${
                      selectedFile?.path === file.path ? "border-cyan-500 bg-cyan-950/10" : "border-slate-800"
                    }`}
                    id={`file-block-${file.name}`}
                  >
                    {/* Render matching icons based on type */}
                    {file.type === "image" ? (
                      <div className="h-10 text-cyan-400 flex items-center justify-center font-display text-2xl mb-1 filter drop-shadow-[0_2px_4px_rgba(6,182,212,0.3)]">
                        🖼️
                      </div>
                    ) : file.type === "spreadsheet" ? (
                      <div className="h-10 text-emerald-400 flex items-center justify-center font-display text-2xl mb-1 filter drop-shadow-[0_2px_4px_rgba(16,185,129,0.3)]">
                        📊
                      </div>
                    ) : (
                      <FileText className="w-9 h-9 mx-auto text-indigo-400 mb-1" />
                    )}

                    <p className="text-[11px] font-sans text-slate-200 truncate pr-1">
                      {file.name}
                    </p>
                    <p className="text-[9px] font-mono text-slate-500">
                      {file.size}
                    </p>

                    {/* Fast action hover delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmDelete(file.path);
                      }}
                      className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 bg-red-950 border border-red-900 rounded-lg text-red-400 hover:text-white transition cursor-pointer"
                      title="Delete Mock File"
                      id={`delete-btn-${file.name}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Organize footer */}
          {currentFolder.endsWith("Downloads") && currentFolderFiles.length > 0 && (
            <div className="bg-slate-950/80 p-2.5 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-sans">Organized loops clutter detected.</span>
              <button
                onClick={() => onExecutePrompt("Organise downloads folder automatically")}
                className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-sans text-xs font-bold rounded-lg transition"
                id="organize-shortcut"
              >
                ⚡ AI Auto-Organize Loop
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* Draggable Window 2: Windows Puppet Sandbox Screen */}
      {/* ========================================================= */}
      {windows.puppetScreen.open && (
        <motion.div
          drag
          dragMomentum={false}
          onDragStart={() => bringToFront("puppetScreen")}
          className="absolute w-[530px] h-[380px] bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden glass-panel flex flex-col"
          style={{ x: windows.puppetScreen.x, y: windows.puppetScreen.y, zIndex: windows.puppetScreen.zIndex }}
          id="window-puppet-screen"
        >
          {/* Header Bar */}
          <div className="h-11 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 cursor-move select-none">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="font-display font-semibold text-xs text-slate-200">
                Win32 Puppeteer Control Monitor
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => toggleWindow("puppetScreen")}
                className="text-slate-400 hover:text-red-400 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                id="btn-puppet-close"
              >
                <Maximize2 className="w-3.5 h-3.5 scale-90" />
              </button>
            </div>
          </div>

          {/* Main Visual Screen sandbox */}
          <div className="flex-1 bg-slate-950 relative overflow-hidden p-4 flex flex-col justify-between" ref={screenRef}>
            {/* Monitor grid texture */}
            <div className="absolute inset-0 bg-radial-gradient from-slate-950 to-slate-900 pointer-events-none opacity-40" />
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

            {/* Simulated Desktop Items */}
            <div className="grid grid-cols-4 gap-4 z-10 p-2 content-start select-none pointer-events-none opacity-60">
              <div className="text-center">
                <Folder className="w-8 h-8 text-cyan-400 mx-auto mb-1 filter drop-shadow-[0_2px_4px_rgba(6,182,212,0.2)]" />
                <span className="text-[10px] text-slate-300 font-mono">Downloads</span>
              </div>
              <div className="text-center">
                <Folder className="w-8 h-8 text-indigo-400 mx-auto mb-1" />
                <span className="text-[10px] text-slate-300 font-mono">Documents</span>
              </div>
              <div className="text-center">
                <Folder className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                <span className="text-[10px] text-slate-300 font-mono">Pictures</span>
              </div>
              <div className="text-center">
                <FileText className="w-8 h-8 text-slate-500 mx-auto mb-1" />
                <span className="text-[10px] text-slate-300 font-mono">Trash</span>
              </div>
            </div>

            {/* Active Plan steps overlays */}
            <div className="z-10 bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 backdrop-blur-md">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                  Active Running Executor Plan
                </span>
                {isAnimatingCursor ? (
                  <span className="text-[9px] font-mono text-yellow-400 animate-pulse bg-yellow-950/40 border border-yellow-900/30 px-1.5 py-0.5 rounded">
                    RUNNING VISUAL LOOP
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-1.5 py-0.5 rounded">
                    HOT IDLE READY
                  </span>
                )}
              </div>

              {/* Steps trail logs */}
              <div className="space-y-1.5 max-h-24 overflow-y-auto">
                {runnerLog.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic font-sans pr-2">
                    Enter any prompt in the bottom Conduit bar. The AI will translate it into Win32 movements and execution targets.
                  </p>
                ) : (
                  runnerLog.slice(-3).map((log, index) => (
                    <div key={index} className="flex gap-1.5 items-start font-mono text-[10px] text-slate-300">
                      <CornerDownRight className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
                      <span>{log}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Simulated Animated Bezier Cursor pointer */}
            <motion.div
              className="absolute z-50 pointer-events-none select-none transition-shadow"
              style={{
                left: cursorPos.x,
                top: cursorPos.y,
              }}
              animate={isAnimatingCursor ? {} : {}}
            >
              <div className="relative">
                {/* Pointer Arrow Icon */}
                <span className="text-3xl filter drop-shadow-[0_2px_10px_rgba(99,102,241,0.6)] select-none">
                  🧭
                </span>
                
                {/* Visual Label Indicator next to cursor */}
                {cursorLabel && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute left-6 top-1 bg-cyan-400 text-slate-950 font-mono font-bold text-[8px] tracking-wider px-1.5 py-0.5 rounded uppercase shadow-md select-none"
                  >
                    {cursorLabel}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* Draggable Window 3: Watchdog Process Governor */}
      {/* ========================================================= */}
      {windows.watchdog.open && (
        <motion.div
          drag
          dragMomentum={false}
          onDragStart={() => bringToFront("watchdog")}
          className="absolute w-[560px] h-[340px] bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden glass-panel flex flex-col"
          style={{ x: windows.watchdog.x, y: windows.watchdog.y, zIndex: windows.watchdog.zIndex }}
          id="window-system-watchdog"
        >
          {/* Header Bar */}
          <div className="h-11 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 cursor-move select-none">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span className="font-display font-semibold text-xs text-slate-200">
                Task Watchdog & Hardware Monitor
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                className="p-1 px-1.5 bg-slate-800 text-[10px] font-mono text-slate-400 hover:text-white rounded-lg cursor-pointer flex items-center gap-1"
                onClick={() => onExecutePrompt("Audit active processes and verify watchdog trust margins")}
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync Tasks</span>
              </button>
              <button
                onClick={() => toggleWindow("watchdog")}
                className="text-slate-400 hover:text-red-400 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                id="btn-watchdog-close"
              >
                <Maximize2 className="w-3.5 h-3.5 scale-90" />
              </button>
            </div>
          </div>

          {/* Processes list area */}
          <div className="flex-1 p-3 overflow-y-auto font-mono text-xs select-none">
            {/* Column labels */}
            <div className="grid grid-cols-12 gap-2 text-slate-500 font-bold border-b border-slate-900 pb-2 mb-2">
              <span className="col-span-2">PID</span>
              <span className="col-span-4">Process Name</span>
              <span className="col-span-2">CPU%</span>
              <span className="col-span-2">Memory</span>
              <span className="col-span-2 text-right">Action</span>
            </div>

            {/* List */}
            <div className="space-y-1">
              {processes.map((p) => (
                <div
                  key={p.pid}
                  className="grid grid-cols-12 gap-2 py-1.5 hover:bg-slate-900/60 items-center border-b border-slate-900/20"
                >
                  <span className="col-span-2 text-slate-400">{p.pid}</span>
                  <span className="col-span-4 text-slate-200 font-semibold">{p.name}</span>
                  <span className="col-span-2 text-emerald-400">{p.cpu}%</span>
                  <span className="col-span-2 text-slate-300">{p.memory}</span>
                  <div className="col-span-2 text-right">
                    <button
                      onClick={() => killSimulatedProcess(p.pid, p.name)}
                      className="text-[10px] px-2 py-0.5 bg-red-950 text-red-400 hover:text-white hover:bg-red-900 border border-red-900 rounded cursor-pointer transition"
                    >
                      KILL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Watchdog status metrics bar */}
          <div className="bg-slate-950/80 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-2 text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Safety Governor: <strong className="text-emerald-400 font-bold">PASSING All CLEARED</strong></span>
            </div>
            <div className="text-slate-500">
              Allocated GGUF: Phi-3-Mini (3.8B quantized)
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* Draggable Window 4: Deep Research Dossier Reader */}
      {/* ========================================================= */}
      {windows.research.open && activeResearchReport && (
        <motion.div
          drag
          dragMomentum={false}
          onDragStart={() => bringToFront("research")}
          className="absolute w-[600px] h-[450px] bg-slate-950 border border-indigo-500/35 rounded-2xl overflow-hidden glass-panel flex flex-col shadow-[0_20px_50px_rgba(99,102,241,0.25)]"
          style={{ x: windows.research.x, y: windows.research.y, zIndex: windows.research.zIndex }}
          id="window-research-dossier"
        >
          {/* Header Bar */}
          <div className="h-11 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 cursor-move select-none">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="font-display font-semibold text-xs text-slate-200">
                Nexus Intelligence Dossier Viewer
              </span>
            </div>
            <button
              onClick={() => toggleWindow("research")}
              className="text-slate-400 hover:text-red-400 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              id="btn-research-close"
            >
              <Maximize2 className="w-3.5 h-3.5 scale-90" />
            </button>
          </div>

          {/* Dossier contents reader */}
          <div className="flex-1 p-6 overflow-y-auto bg-slate-950 text-slate-300 font-sans leading-relaxed selection:bg-indigo-500 selection:text-white">
            <div className="prose prose-invert prose-xs max-w-none">
              {/* Elegant header banner */}
              <div className="border-b border-indigo-500/20 pb-4 mb-6">
                <span className="text-[9px] font-mono font-bold tracking-widest text-indigo-400 uppercase bg-indigo-950 border border-indigo-900/30 px-2 py-0.5 rounded">
                  RESEARCH NODE COMPILED LIVE
                </span>
                <h1 className="text-2xl font-display font-bold text-white mt-2 mb-1 tracking-tight">
                  Quantum Deep Analysis Dossier
                </h1>
                <p className="text-[11px] text-slate-500 font-mono">
                  Compiled at: {new Date().toISOString().substring(0, 10)} | Operator ID: gxqstudio@gmail.com
                </p>
              </div>

              {/* Markdown simulation renderer */}
              <div className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-300 bg-slate-950 p-4 border border-slate-900 rounded-xl max-h-72 overflow-y-auto">
                {activeResearchReport}
              </div>
            </div>
          </div>

          {/* Copy option footer */}
          <div className="bg-slate-900 border-t border-slate-800 p-3 px-4 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-sans">Output compiled to: C:\Users\NexusUser\Documents</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(activeResearchReport);
                alert("Markdown dossier copied to clipboard!");
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 hover:text-white text-slate-100 font-display font-bold rounded-lg transition"
              id="copy-research-btn"
            >
              Copy Report Markdown
            </button>
          </div>
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* Draggable Window 5: Speech & voice synthesizer */}
      {/* ========================================================= */}
      {windows.creativeSynth.open && (
        <motion.div
          drag
          dragMomentum={false}
          onDragStart={() => bringToFront("creativeSynth")}
          className="absolute w-[440px] h-[310px] bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden glass-panel flex flex-col"
          style={{ x: windows.creativeSynth.x, y: windows.creativeSynth.y, zIndex: windows.creativeSynth.zIndex }}
          id="window-synth-cockpit"
        >
          {/* Header Bar */}
          <div className="h-11 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 cursor-move select-none">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span className="font-display font-semibold text-xs text-slate-200">
                Vocal Synthesis & Media Cockpit
              </span>
            </div>
            <button
              onClick={() => toggleWindow("creativeSynth")}
              className="text-slate-400 hover:text-red-400 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              id="btn-synth-close"
            >
              <Maximize2 className="w-3.5 h-3.5 scale-90" />
            </button>
          </div>

          {/* Synth interface */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <label className="text-[10px] font-mono text-slate-400 uppercase select-none">
                Vocal Buffer Output Text:
              </label>
              <textarea
                value={synthText}
                onChange={(e) => setSynthText(e.target.value)}
                placeholder="Type anything here. Nexus One will convert it to speech using the Gemini Voice modules..."
                className="w-full h-24 bg-slate-950 border border-slate-800 focus:border-amber-500/40 rounded-xl p-3 text-xs focus:outline-none text-slate-100 font-sans"
                id="voice-textarea"
              />
            </div>

            {/* Synthesizer voice trigger */}
            <div className="flex gap-2">
              <button
                onClick={synthesizeTextToSpeech}
                disabled={isSynthesizing || !synthText.trim()}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-sans text-xs font-bold rounded-xl shadow-lg transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                id="trigger-voice-synth"
              >
                {isSynthesizing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>SYNTHESIZING...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>SYNTHESIZE VOCAL SPEECH</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* Draggable Window 6: Automated Task Analytics / Trend Chart */}
      {/* ========================================================= */}
      {windows.taskTrend.open && (
        <motion.div
          drag
          dragMomentum={false}
          onDragStart={() => bringToFront("taskTrend")}
          className="absolute w-[530px] h-[380px] bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden glass-panel flex flex-col shadow-[0_20px_50px_rgba(99,102,241,0.15)] animate-in fade-in-50"
          style={{ x: windows.taskTrend.x, y: windows.taskTrend.y, zIndex: windows.taskTrend.zIndex }}
          id="window-task-trend"
        >
          {/* Header Bar */}
          <div className="h-11 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 cursor-move select-none">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span className="font-display font-semibold text-xs text-slate-200">
                Automated Task Frequency & Metrics
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                className="p-1 px-1.5 bg-slate-800 text-[10px] font-mono text-slate-400 hover:text-white rounded-lg cursor-pointer flex items-center gap-1"
                onClick={() => onExecutePrompt("Generate automated task frequency report and verify efficiency trends")}
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync Metrics</span>
              </button>
              <button
                onClick={() => toggleWindow("taskTrend")}
                className="text-slate-400 hover:text-red-400 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                id="btn-task-trend-close"
              >
                <Maximize2 className="w-3.5 h-3.5 scale-90" />
              </button>
            </div>
          </div>

          {/* Interface body */}
          <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
            {/* Quick KPI stats row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-900/60 border border-slate-800/40 rounded-xl p-2.5 text-left">
                <span className="text-[9px] font-mono font-medium text-slate-500 uppercase tracking-wider block">
                  Total Tasks
                </span>
                <span className="text-xl font-display font-bold text-white block mt-0.5">
                  {auditLogs.length}
                </span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/40 rounded-xl p-2.5 text-left">
                <span className="text-[9px] font-mono font-medium text-slate-500 uppercase tracking-wider block">
                  Success Rate
                </span>
                <span className="text-xl font-display font-bold text-emerald-400 block mt-0.5">
                  {auditLogs.length > 0
                    ? Math.round((auditLogs.filter(l => l.success !== false).length / auditLogs.length) * 100)
                    : 100}%
                </span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/40 rounded-xl p-2.5 text-left">
                <span className="text-[9px] font-mono font-medium text-slate-500 uppercase tracking-wider block">
                  Total Subtasks
                </span>
                <span className="text-xl font-display font-bold text-cyan-400 block mt-0.5">
                  {auditLogs.reduce((sum, log) => sum + (log.steps?.length || 0), 0)}
                </span>
              </div>
            </div>

            {/* Recharts container wrapper */}
            <div className="flex-1 min-h-[180px] bg-slate-950 border border-slate-900 rounded-xl p-2 select-none relative">
              <div className="absolute top-2 left-3 z-10 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[9px] font-mono text-slate-400 font-semibold tracking-wider uppercase">
                  Daily Execution Frequency
                </span>
              </div>
              
              {auditLogs.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-xs font-mono text-slate-500">
                  Waiting for task execution history...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={getChartData()}
                    margin={{ top: 25, right: 15, left: -25, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#475569"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      dy={5}
                    />
                    <YAxis
                      stroke="#475569"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderColor: "#1e293b",
                        borderRadius: "12px",
                        fontSize: "10px",
                        fontFamily: "monospace",
                        color: "#f8fafc"
                      }}
                    />
                    <Area
                      name="Runs"
                      type="monotone"
                      dataKey="tasks"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorTasks)"
                      activeDot={{ r: 4 }}
                    />
                    <Area
                      name="Subactions"
                      type="monotone"
                      dataKey="steps"
                      stroke="#06b6d4"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#colorSteps)"
                      activeDot={{ r: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* Draggable Window 7: System Health Metrics */}
      {/* ========================================================= */}
      {windows.systemHealth.open && (
        <motion.div
          drag
          dragMomentum={false}
          onDragStart={() => bringToFront("systemHealth")}
          className="absolute w-[530px] h-[380px] bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden glass-panel flex flex-col shadow-[0_20px_50px_rgba(16,185,129,0.15)] animate-in fade-in-50"
          style={{ x: windows.systemHealth.x, y: windows.systemHealth.y, zIndex: windows.systemHealth.zIndex }}
          id="window-system-health"
        >
          {/* Header Bar */}
          <div className="h-11 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 cursor-move select-none">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="font-display font-semibold text-xs text-slate-200">
                Agentic Sandbox Health
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => toggleWindow("systemHealth")}
                className="text-slate-400 hover:text-red-400 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                id="btn-system-health-close"
              >
                <Maximize2 className="w-3.5 h-3.5 scale-90" />
              </button>
            </div>
          </div>

          {/* Interface body */}
          <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
            {/* Quick KPI stats row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900/60 border border-slate-800/40 rounded-xl p-2.5 text-left flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono font-medium text-slate-500 uppercase tracking-wider block">
                    CPU Load
                  </span>
                  <span className="text-xl font-display font-bold text-white block mt-0.5">
                    {healthData.length > 0 ? healthData[healthData.length - 1].cpu : 0}%
                  </span>
                </div>
                <Cpu className="w-6 h-6 text-indigo-400/50" />
              </div>
              <div className="bg-slate-900/60 border border-slate-800/40 rounded-xl p-2.5 text-left flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono font-medium text-slate-500 uppercase tracking-wider block">
                    Memory Footprint
                  </span>
                  <span className="text-xl font-display font-bold text-emerald-400 block mt-0.5">
                    {healthData.length > 0 ? healthData[healthData.length - 1].memory : 0} MB
                  </span>
                </div>
                <HardDrive className="w-6 h-6 text-emerald-400/50" />
              </div>
            </div>

            {/* Recharts container wrapper */}
            <div className="flex-1 min-h-[180px] bg-slate-950 border border-slate-900 rounded-xl p-2 select-none relative">
              <div className="absolute top-2 left-3 z-10 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
                <span className="text-[9px] font-mono text-slate-400 font-semibold tracking-wider uppercase">
                  Real-time Consumption
                </span>
              </div>
              
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={healthData}
                  margin={{ top: 25, right: 15, left: -25, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#475569"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    dy={5}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#818cf8"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#10b981"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    domain={['dataMin - 100', 'dataMax + 100']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderColor: "#1e293b",
                      borderRadius: "12px",
                      fontSize: "10px",
                      fontFamily: "monospace",
                      color: "#f8fafc"
                    }}
                  />
                  <Area
                    yAxisId="left"
                    name="CPU (%)"
                    type="monotone"
                    dataKey="cpu"
                    stroke="#818cf8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCpu)"
                    isAnimationActive={false}
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    yAxisId="right"
                    name="Memory (MB)"
                    type="monotone"
                    dataKey="memory"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#colorMemory)"
                    isAnimationActive={false}
                    activeDot={{ r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* Modal: Create Mock Sandbox File */}
      {/* ========================================================= */}
      {showNewFileModal && (
        <div className="absolute inset-0 bg-slate-950/80 z-50 flex items-center justify-center select-none backdrop-blur-sm">
          <motion.div
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-5 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="text-sm font-semibold font-display text-white mb-4">
              Create New Simulated File
            </h3>
            <form onSubmit={handleCreateFileSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 block">FILENAME</label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g., pitch_draft.docx, report.xlsx"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/40 rounded-xl p-2 px-3 text-xs text-white focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 block font-normal">FILE CONTENTS (OPTIONAL)</label>
                <textarea
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  placeholder="Enter file text content..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/40 rounded-xl p-2 px-3 text-xs text-white h-20 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-bold rounded-xl cursor-pointer"
                >
                  Create File
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
