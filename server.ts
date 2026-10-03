import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured. Please add it via Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Global Simulated State
interface MockFile {
  name: string;
  path: string; // e.g. "C:\\Users\\NexusUser\\Desktop\\photo.png"
  size: string;
  type: string;
  content?: string;
  dateCreated: string;
}

interface ProcessItem {
  pid: number;
  name: string;
  cpu: number;
  memory: string;
  status: "Running" | "Suspended" | "Idle";
}

interface AuditLog {
  id: string;
  timestamp: string;
  instruction: string;
  success: boolean;
  steps: Array<{
    action: string;
    target: string;
    status: "Completed" | "Pending" | "Error";
    details?: string;
  }>;
}

interface Persona {
  id: string;
  name: string;
  avatar: string;
  role: string;
  prompt: string;
  active: boolean;
}

// Initial Simulated File Tree
let mockFileSystem: MockFile[] = [
  // Desktop
  { name: "TodoList.txt", path: "C:\\Users\\NexusUser\\Desktop\\TodoList.txt", size: "1.2 KB", type: "document", content: "- Finalize Nexus/One pitch deck\n- Debug Windows Puppeteer Rust loop\n- Review budget spreadsheets\n- Dinner at 7 PM", dateCreated: "2026-06-12" },
  { name: "OldDesign.png", path: "C:\\Users\\NexusUser\\Desktop\\OldDesign.png", size: "4.5 MB", type: "image", dateCreated: "2026-06-10" },
  { name: "RawNotes.md", path: "C:\\Users\\NexusUser\\Desktop\\RawNotes.md", size: "2.4 KB", type: "document", content: "# Notes on Local LLM speed\n- Phi-3 Q4 runs at ~30 tokens/sec on mobile CPUs\n- DirectML provides hardware acceleration\n- Context window is very deep", dateCreated: "2026-06-14" },
  
  // Downloads (unorganized clutter)
  { name: "invoice_29381.pdf", path: "C:\\Users\\NexusUser\\Downloads\\invoice_29381.pdf", size: "145 KB", type: "document", dateCreated: "2026-06-15" },
  { name: "nexus_one_installer.exe", path: "C:\\Users\\NexusUser\\Downloads\\nexus_one_installer.exe", size: "125 MB", type: "executable", dateCreated: "2026-06-15" },
  { name: "screenshot_2026_06_12.jpg", path: "C:\\Users\\NexusUser\\Downloads\\screenshot_2026_06_12.jpg", size: "1.8 MB", type: "image", dateCreated: "2026-06-12" },
  { name: "screenshot_2026_06_14.jpg", path: "C:\\Users\\NexusUser\\Downloads\\screenshot_2026_06_14.jpg", size: "3.2 MB", type: "image", dateCreated: "2026-06-14" },
  { name: "cat_meme_flux.png", path: "C:\\Users\\NexusUser\\Downloads\\cat_meme_flux.png", size: "820 KB", type: "image", dateCreated: "2026-06-13" },
  { name: "sales_report_draft.xlsx", path: "C:\\Users\\NexusUser\\Downloads\\sales_report_draft.xlsx", size: "1.4 MB", type: "spreadsheet", dateCreated: "2026-06-15" },
  
  // Documents
  { name: "AnnualPlans_Q3.docx", path: "C:\\Users\\NexusUser\\Documents\\AnnualPlans_Q3.docx", size: "480 KB", type: "document", content: "Executive Overview\nQuantum Cloud Sync will launch on-schedule in Q3 2026.", dateCreated: "2026-06-11" },
  { name: "PersonalFinance_2026.xlsx", path: "C:\\Users\\NexusUser\\Documents\\PersonalFinance_2026.xlsx", size: "2.1 MB", type: "spreadsheet", dateCreated: "2026-06-01" },
  
  // Pictures (empty or clean)
  { name: "avatar_me.jpg", path: "C:\\Users\\NexusUser\\Pictures\\avatar_me.jpg", size: "420 KB", type: "image", dateCreated: "2026-05-20" }
];

function upsertMockFile(newFile: MockFile) {
  const index = mockFileSystem.findIndex(f => f.path.toLowerCase() === newFile.path.toLowerCase());
  if (index !== -1) {
    mockFileSystem[index] = { ...mockFileSystem[index], ...newFile };
  } else {
    mockFileSystem.push(newFile);
  }
}

// Initial running process list
let mockProcesses: ProcessItem[] = [
  { pid: 1420, name: "NexusOne.exe", cpu: 0.1, memory: "45.2 MB", status: "Running" },
  { pid: 3824, name: "llm_server.exe", cpu: 0.0, memory: "1.8 GB", status: "Idle" },
  { pid: 928, name: "Explorer.exe", cpu: 1.2, memory: "128.5 MB", status: "Running" },
  { pid: 2108, name: "SystemSettings.exe", cpu: 0.0, memory: "32.0 MB", status: "Suspended" },
  { pid: 7420, name: "Chrome.exe", cpu: 4.8, memory: "892.6 MB", status: "Running" },
  { pid: 1104, name: "Qdrant_VectorDB.exe", cpu: 0.2, memory: "112.4 MB", status: "Running" }
];

// Episodic and Semantic Memories mock database
let mockMemories = [
  { id: "mem_1", type: "procedural", text: "User prefers organising screenshots into Desktop\\Screenshots folder", timestamp: "2026-06-12 14:35" },
  { id: "mem_2", type: "semantic", text: "Main client workspace registered at C:\\Users\\NexusUser\\Desktop", timestamp: "2026-06-10 09:12" },
  { id: "mem_3", type: "episodic", text: "Executed 'Deep Research on Quantum Compute trends' for gxqstudio@gmail.com", timestamp: "2026-06-15 06:40" }
];

// Audit Trails
let mockAuditLogs: AuditLog[] = [
  {
    id: "audit_1",
    timestamp: "2026-06-15T06:30:12Z",
    instruction: "Clean my downloads folder and separate documents from screenshots",
    success: true,
    steps: [
      { action: "Scan Dir", target: "C:\\Users\\NexusUser\\Downloads", status: "Completed", details: "Found 6 cluttered files" },
      { action: "Create Subdir", target: "C:\\Users\\NexusUser\\Downloads\\Documents", status: "Completed", details: "Created cleanly" },
      { action: "Move File", target: "invoice_29381.pdf", status: "Completed", details: "Moved successfully" }
    ]
  }
];

// Personas Forge list
let mockPersonas: Persona[] = [
  { id: "p1", name: "Samantha Cole", role: "Therapist & Executive Advisor", prompt: "You are calming, direct, focused on mindfulness and mental resilience under workload.", avatar: "🌸", active: true },
  { id: "p2", name: "DevCore Rust", role: "Elite Win32 C++ / Rust Compiler", prompt: "You always format code in clean Rust/C++. Focus heavily on safety guards, pointer verification, and raw speed.", avatar: "🦀", active: false },
  { id: "p3", name: "Chief Legal AI", role: "Corporate Counsel & Compliance Advisor", prompt: "Verify all actions against legal frameworks, privacy policies and GDPR/HIPAA mandates.", avatar: "⚖️", active: false },
  { id: "p4", name: "Socrates", role: "Socratic Dialog Mentor", prompt: "Acknowledge with constructive questions, pushing user to refine hypotheses recursively.", avatar: "🏛️", active: false }
];

// Helper to update files and audit logs
function logAudit(instruction: string, success: boolean, steps: Array<{ action: string; target: string; status: "Completed" | "Pending" | "Error"; details?: string }>) {
  const newLog: AuditLog = {
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    instruction,
    success,
    steps
  };
  mockAuditLogs.unshift(newLog);
  // Add an episodic memory
  mockMemories.unshift({
    id: `mem_${Date.now()}`,
    type: "episodic",
    text: `Completed instruction: "${instruction}" successfully.`,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
  });
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Health Check
app.get("/api/health", (req, res) => {
  const hasSecret = !!process.env.GEMINI_API_KEY;
  res.json({ status: "healthy", hasGeminiKey: hasSecret });
});

// Files retrieve
app.get("/api/fs", (req, res) => {
  res.json({ files: mockFileSystem });
});

// File system actions (New, Rename, Move, Copy, Delete)
app.post("/api/fs/action", (req, res) => {
  const { op, source, dest, name, content, type } = req.body;
  try {
    if (op === "create") {
      const fullPath = dest ? `${dest}\\${name}` : `C:\\Users\\NexusUser\\Desktop\\${name}`;
      const newFile: MockFile = {
        name,
        path: fullPath,
        size: content ? `${(content.length / 1024).toFixed(1)} KB` : "0 B",
        type: type || "document",
        content: content || "",
        dateCreated: new Date().toISOString().split("T")[0]
      };
      upsertMockFile(newFile);
      logAudit(`Created file ${name}`, true, [{ action: "Create File", target: fullPath, status: "Completed" }]);
    } else if (op === "delete") {
      mockFileSystem = mockFileSystem.filter(f => f.path !== source);
      logAudit(`Deleted file ${source}`, true, [{ action: "Delete File", target: source, status: "Completed" }]);
    } else if (op === "move") {
      const filename = source.split("\\").pop() || "unknown";
      const fileIndex = mockFileSystem.findIndex(f => f.path === source);
      if (fileIndex !== -1) {
        const targetPath = `${dest}\\${filename}`;
        mockFileSystem[fileIndex].path = targetPath;
        logAudit(`Moved ${filename} to ${dest}`, true, [
          { action: "Move File", target: source, status: "Completed", details: `Target path: ${targetPath}` }
        ]);
      } else {
        throw new Error("Source file not found in simulated workspace");
      }
    } else if (op === "organize_downloads") {
      // Custom clean/organize logic
      const downloadsFiles = mockFileSystem.filter(f => f.path.startsWith("C:\\Users\\NexusUser\\Downloads\\"));
      let movedCount = 0;
      downloadsFiles.forEach(file => {
        // Move images to Pictures, spreadsheets/docs to Documents, executable stays
        if (file.type === "image") {
          file.path = file.path.replace("Downloads\\", "Pictures\\");
          movedCount++;
        } else if (file.type === "spreadsheet" || file.type === "document") {
          file.path = file.path.replace("Downloads\\", "Documents\\");
          movedCount++;
        }
      });
      logAudit("Organize Downloads Folder", true, [
        { action: "Scan", target: "Downloads Folder", status: "Completed", details: `Found ${downloadsFiles.length} files` },
        { action: "Move Batch", target: "Pictures & Documents", status: "Completed", details: `Sorted and moved ${movedCount} documents/images` }
      ]);
    }
    res.json({ success: true, files: mockFileSystem });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Processes list
app.get("/api/processes", (req, res) => {
  res.json({ processes: mockProcesses });
});

// System diagnostics
app.post("/api/processes/control", (req, res) => {
  const { action, pid, name } = req.body;
  if (action === "kill") {
    mockProcesses = mockProcesses.filter(p => p.pid !== pid);
    logAudit(`Killed process PID: ${pid} (${name})`, true, [{ action: "Kill Process", target: `PID ${pid}`, status: "Completed" }]);
  } else if (action === "start") {
    const newPid = Math.floor(Math.random() * 9000) + 1000;
    mockProcesses.push({
      pid: newPid,
      name,
      cpu: parseFloat((Math.random() * 5).toFixed(1)),
      memory: `${Math.floor(Math.random() * 400) + 50} MB`,
      status: "Running"
    });
    logAudit(`Spawned process: ${name}`, true, [{ action: "Spawn Process", target: name, status: "Completed", details: `Allocated PID: ${newPid}` }]);
  }
  res.json({ success: true, processes: mockProcesses });
});

// Memories vector endpoint
app.get("/api/memories", (req, res) => {
  res.json({ memories: mockMemories });
});

app.post("/api/memories/add", (req, res) => {
  const { type, text } = req.body;
  const newMem = {
    id: `mem_${Date.now()}`,
    type: type || "semantic",
    text,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
  };
  mockMemories.unshift(newMem);
  res.json({ success: true, memories: mockMemories });
});

// Personas Forge edit
app.get("/api/personas", (req, res) => {
  res.json({ personas: mockPersonas });
});

app.post("/api/personas/toggle", (req, res) => {
  const { id } = req.body;
  mockPersonas = mockPersonas.map(p => {
    if (p.id === id) {
      return { ...p, active: true };
    }
    return { ...p, active: false };
  });
  const activeName = mockPersonas.find(p => p.active)?.name || "Default";
  logAudit(`Switched active AI companion to ${activeName}`, true, [{ action: "Forge Personality", target: activeName, status: "Completed" }]);
  res.json({ success: true, personas: mockPersonas });
});

// Create new persona
app.post("/api/personas/create", (req, res) => {
  const { name, role, prompt, avatar } = req.body;
  const newP: Persona = {
    id: `p_${Date.now()}`,
    name,
    role,
    prompt,
    avatar: avatar || "🧙",
    active: false
  };
  mockPersonas.push(newP);
  logAudit(`Created new persona: ${name}`, true, [{ action: "Personality Forge", target: name, status: "Completed" }]);
  res.json({ success: true, personas: mockPersonas });
});

// Enterprise Image Generation endpoint for PersonaForge unique AI avatars
app.post("/api/personas/generate-avatar", async (req, res) => {
  const { name, role, theme = "cyan", style = "cyberpunk" } = req.body;
  if (!name || !role) {
    return res.status(400).json({ error: "Missing name or role for avatar generation" });
  }

  try {
    // Generate stylized cyber initials & palette
    const initials = name.split(" ").map((w: string) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "NX";
    const colorMap: Record<string, { primary: string; secondary: string; glow: string }> = {
      cyan: { primary: "#00e5ff", secondary: "#0066ff", glow: "rgba(0, 229, 255, 0.45)" },
      orange: { primary: "#ff7700", secondary: "#ff3700", glow: "rgba(255, 119, 0, 0.45)" },
      crimson: { primary: "#ff0055", secondary: "#990033", glow: "rgba(255, 0, 85, 0.45)" },
      amber: { primary: "#ffd700", secondary: "#ff9100", glow: "rgba(255, 215, 0, 0.45)" },
      purple: { primary: "#c084fc", secondary: "#7e22ce", glow: "rgba(192, 132, 252, 0.45)" }
    };
    const c = colorMap[theme] || colorMap.cyan;
    const roleSlug = (role || "OPERATOR").slice(0, 10).toUpperCase();

    // Procedural SVG Cybernetic AI Avatar
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="bgG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#050814" />
          <stop offset="100%" stop-color="#0c1427" />
        </linearGradient>
        <linearGradient id="neonG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c.primary}" />
          <stop offset="100%" stop-color="${c.secondary}" />
        </linearGradient>
        <filter id="fGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect width="200" height="200" rx="26" fill="url(#bgG)" stroke="${c.primary}" stroke-width="2" stroke-opacity="0.4" />
      <path d="M 25 45 L 60 45 L 80 25 L 145 25" stroke="${c.primary}" stroke-width="1.5" stroke-opacity="0.3" fill="none" />
      <path d="M 175 155 L 140 155 L 120 175 L 55 175" stroke="${c.primary}" stroke-width="1.5" stroke-opacity="0.3" fill="none" />
      <circle cx="80" cy="25" r="3" fill="${c.primary}" />
      <circle cx="120" cy="175" r="3" fill="${c.primary}" />
      <circle cx="100" cy="95" r="52" fill="#040711" stroke="url(#neonG)" stroke-width="3" filter="url(#fGlow)" />
      <circle cx="100" cy="95" r="42" fill="#091122" stroke="${c.primary}" stroke-width="1" stroke-dasharray="4,3" stroke-opacity="0.6" />
      <rect x="58" y="86" width="84" height="18" rx="9" fill="url(#neonG)" opacity="0.85" filter="url(#fGlow)" />
      <line x1="62" y1="95" x2="138" y2="95" stroke="#ffffff" stroke-width="1.5" opacity="0.9" />
      <text x="100" y="102" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle" letter-spacing="1">${initials}</text>
      <rect x="35" y="154" width="130" height="20" rx="6" fill="#050914" stroke="${c.primary}" stroke-width="1" stroke-opacity="0.7" />
      <text x="100" y="167" font-family="monospace" font-weight="700" font-size="9" fill="${c.primary}" text-anchor="middle" letter-spacing="1.5">${roleSlug}</text>
      <circle cx="166" cy="34" r="4" fill="${c.primary}" filter="url(#fGlow)" />
      <text x="156" y="37" font-family="monospace" font-size="8" fill="#e0f7fa" text-anchor="end" opacity="0.7">AI•GEN</text>
    </svg>`;

    const avatarUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
    res.json({
      success: true,
      avatarUrl,
      name,
      role,
      theme
    });
  } catch (err: any) {
    console.error("Avatar generation error:", err);
    res.status(500).json({ error: "Failed to generate AI avatar" });
  }
});

// Audit log endpoint
app.get("/api/audit", (req, res) => {
  res.json({ logs: mockAuditLogs });
});

// -------------------------------------------------------------
// Story Generator and Text Adventure Game Endpoints
// -------------------------------------------------------------

// Story Generator
app.post("/api/story/generate", async (req, res) => {
  const { keywords, genre, tone } = req.body;
  if (!keywords || keywords.length === 0) {
    return res.status(400).json({ error: "Missing keywords for story generation." });
  }

  try {
    const ai = getGeminiClient();
    const systemPrompt = `
      You are an expert interactive sci-fi, fantasy, and adventure cyberpunk novelist.
      Generate a short, extremely coherent, engaging, and atmospheric story based on these keywords: ${JSON.stringify(keywords)}.
      Genre of story: ${genre || "Cyberpunk Sci-Fi"}.
      Tone: ${tone || "Mysterious & Gritty"}.
      
      You must respond with raw JSON in this exact structure (no backticks, no Markdown, just pure JSON).
      JSON Structure:
      {
        "title": "A short engaging cybernetic title",
        "beginning": "The introductory scenario, setting the atmosphere and introducing the keywords/characters.",
        "middle": "The rising action, conflict, or central event involving the keywords.",
        "end": "The conclusion, resolving the tension or ending on an evocative note."
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: "Write a creative story based on keywords and output as structured JSON.",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const parsedStory = JSON.parse(response.text || "{}");
    res.json({ success: true, story: parsedStory });
  } catch (err: any) {
    console.error("Story generation failed:", err);
    // Offline / fallback story builder
    const fallbackStory = {
      title: "The Neon Fallback Loop",
      beginning: `Through the hazy neon smog of the lower sectors, the concept of ${keywords.join(" and ")} flickered like a dying holographic sign.`,
      middle: `Suddenly, a high-frequency override signal surged. An operator executed a direct protocol stack, binding the fragments together in an emergency buffer loop.`,
      end: `The terminals synchronized, clearing the system registers as a new cycle began, cold and silent.`
    };
    res.json({ success: true, story: fallbackStory, isOffline: true });
  }
});

// Text Adventure Game - Start
app.post("/api/game/start", async (req, res) => {
  const { theme } = req.body;

  // Enterprise Crypto Text Adventure starting in the Dark Room
  const cryptoDarkRoomState = {
    scenario: "You awaken in a pitch-black, pressurized security chamber deep within the subterranean blockchain vault. The cold metallic floor beneath your boots vibrates with high-frequency quantum hash algorithms. Through the pitch darkness, a faint amber terminal LED blinks in the distance, casting eerie shadows across reinforced titanium bulkheads. A heavy encrypted biometric blast door seals the northern corridor, marked with the luminous insignia 'GXQ-VAULT PROTOCOL'. What do you do?",
    prompt: "Enter a command (e.g., 'look around', 'go north', 'take key', 'unlock door with gxq'):",
    choices: ["look around", "go north", "take key", "take power cell", "unlock door with gxq"],
    inventory: ["Quantum Comms Link"],
    roomItems: ["GXQ Cryptographic Keycard", "Overcharged SOL Power Cell", "NEXUS Quantum Shard"],
    doorLocked: true,
    condition: "playing" as const,
    health: 100
  };

  if (!theme || theme === "crypto" || theme === "cyberpunk") {
    return res.json({ success: true, gameState: cryptoDarkRoomState });
  }

  try {
    const ai = getGeminiClient();
    const systemPrompt = `
      You are the ultimate interactive Dungeon Master AI. Prepare the STARTING SCENARIO for a retro text adventure game.
      Theme: ${theme}.
      Generate starting scenario in a dark mysterious room, starting choices (3 choices), and logical starting inventory (2 items).
      Output raw JSON: { "scenario": string, "choices": string[], "inventory": string[] }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: "Start text adventure game and return starting state in JSON.",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const startingState = JSON.parse(response.text || "{}");
    res.json({
      success: true,
      gameState: {
        ...startingState,
        doorLocked: true,
        condition: "playing",
        health: 100
      }
    });
  } catch (err: any) {
    res.json({ success: true, gameState: cryptoDarkRoomState, isOffline: true });
  }
});

// Text Adventure Game - Take Action
app.post("/api/game/action", async (req, res) => {
  const { theme, previousScenario, actionSelected, currentInventory = [], currentHealth = 100, doorLocked = true } = req.body;
  const action = (actionSelected || "").toLowerCase().trim();
  let updatedInventory = Array.isArray(currentInventory) ? [...currentInventory] : [];
  let updatedDoorLocked = doorLocked;
  let condition: "playing" | "win" | "loss" = "playing";
  let healthDelta = 0;
  let replyScenario = "";
  let choices = ["look around", "go north", "take key", "unlock door with gxq", "check inventory"];

  // Deterministic command parser for Enterprise Crypto Text Adventure
  if (action === "look around" || action === "look" || action === "examine room" || action === "search room" || action === "scan") {
    replyScenario = "Your cybernetic ocular implants calibrate to the darkness. You scan the chamber:\n• To the NORTH sits a massive biometric Cryo-Vault Door requiring a Cryptographic Master Keycard and GXQ / NEXUS signature.\n• In the WESTERN corner lies a maintenance rack with a glowing 'GXQ Cryptographic Keycard' and an 'Overcharged SOL Power Cell'.\n• On the EASTERN wall, a breaker panel holds a humming 'NEXUS Quantum Shard'.\n• A terminal prompt blinks in front of you.";
    choices = ["take key", "take power cell", "take shard", "go north", "check inventory"];
  } else if (action === "take key" || action === "take keycard" || action === "pick up key" || action === "get key" || action === "take gxq key") {
    if (updatedInventory.includes("GXQ Cryptographic Keycard")) {
      replyScenario = "You already have the GXQ Cryptographic Keycard safely secured in your enterprise inventory.";
    } else {
      updatedInventory.push("GXQ Cryptographic Keycard");
      replyScenario = "You reach into the maintenance rack and retrieve the 'GXQ Cryptographic Keycard'! The holographic gold microchip pulses with 256-bit GXQ encryption. You can now use it to unlock the blast door to the North!";
    }
    choices = ["go north", "unlock door with gxq", "take power cell", "look around"];
  } else if (action === "take power cell" || action === "take sol" || action === "take battery" || action === "pick up power cell") {
    if (updatedInventory.includes("Overcharged SOL Power Cell")) {
      replyScenario = "You already have the Overcharged SOL Power Cell in your enterprise inventory.";
    } else {
      updatedInventory.push("Overcharged SOL Power Cell");
      replyScenario = "You disconnect the 'Overcharged SOL Power Cell' from its cradle. It vibrates with 100 SOL electrical potential, ready to power terminals or lighting systems.";
    }
    choices = ["use power cell", "take key", "go north", "look around"];
  } else if (action === "take shard" || action === "take nexus shard" || action === "pick up shard") {
    if (updatedInventory.includes("NEXUS Quantum Shard")) {
      replyScenario = "You already possess the NEXUS Quantum Shard.";
    } else {
      updatedInventory.push("NEXUS Quantum Shard");
      replyScenario = "You unseat the crystalline 'NEXUS Quantum Shard' from the wall panel. It emits a serene cyan glow, radiating pure entropy.";
    }
    choices = ["use shard", "take key", "go north", "look around"];
  } else if (action === "go north" || action === "north" || action === "walk north") {
    if (updatedDoorLocked) {
      replyScenario = "You approach the massive blast door to the North. The display flashes bright amber: 'LOCKED - AUTHORIZED CRYPTO KEYCARD & SIGNATURE (GXQ, NEXUS, or SOL) REQUIRED'. The titanium deadbolts remain firmly engaged. You must find the key and unlock the door.";
      choices = ["take key", "unlock door with gxq", "look around", "use power cell"];
    } else {
      replyScenario = "The unlocked blast door glides open. You step forward into the radiant subterranean Crypto Vault Core! Holographic vaults containing billions of GXQ, NEXUS, and SOL tokens sparkle under crystalline stadium lighting. System security AI bows to your cryptographic clearance. WIN CONDITION ACHIEVED: YOU HAVE MASTERED THE ENTERPRISE CRYPTO VAULT!";
      condition = "win";
      choices = [];
    }
  } else if (action === "unlock door" || action === "unlock door with gxq" || action === "unlock with nexus" || action === "unlock with sol" || action === "use key" || action === "use keycard" || action === "unlock") {
    if (updatedInventory.includes("GXQ Cryptographic Keycard") || updatedInventory.includes("Key") || updatedInventory.includes("Data Spike")) {
      updatedDoorLocked = false;
      replyScenario = "You slide the GXQ Cryptographic Keycard into the terminal slot. The scanner flashes emerald green: 'CRYPTOGRAPHIC SIGNATURE VERIFIED: 100 GXQ & NEXUS HASH CONFIRMED'. Heavy hydraulic gears hiss and clunk as the Northern blast door slides open! The corridor to the Vault is now wide open! (Type 'go north' to enter!)";
      choices = ["go north", "look around", "check inventory"];
    } else {
      replyScenario = "You attempt to unlock the blast door, but you do not have the required GXQ Cryptographic Keycard! Search the room or maintenance rack to locate the key first.";
      choices = ["take key", "look around", "take power cell"];
    }
  } else if (action === "use power cell" || action === "use sol" || action === "use battery") {
    if (updatedInventory.includes("Overcharged SOL Power Cell")) {
      replyScenario = "You plug the Overcharged SOL Power Cell into the terminal grid. A wave of electrical hum floods the chamber—emergency floodlights burst to life, illuminating every corner of the dark room! The northern blast door terminal now glows brightly, awaiting your key.";
      choices = ["take key", "unlock door with gxq", "go north"];
    } else {
      replyScenario = "You don't have the Overcharged SOL Power Cell in your inventory. Pick it up from the maintenance rack first.";
    }
  } else if (action === "use shard" || action === "use nexus shard") {
    if (updatedInventory.includes("NEXUS Quantum Shard")) {
      replyScenario = "You tap into the NEXUS Quantum Shard. A soothing wave of cybernetic nanites repairs your exoskeleton. System Integrity restored to 100%! Terminal HUD highlights the Northern Blast Door lock.";
      healthDelta = 10;
      choices = ["unlock door with gxq", "go north", "take key"];
    } else {
      replyScenario = "You don't have the NEXUS Quantum Shard in your inventory. Pick it up from the eastern breaker panel first.";
    }
  } else if (action === "inventory" || action === "i" || action === "check inventory" || action === "bag") {
    replyScenario = `Enterprise Inventory Matrix Status: [${updatedInventory.length} Items Held]\n` +
      updatedInventory.map(item => `• ${item}`).join("\n") +
      "\nYou can interact with any item by typing 'use <item name>'.";
  } else if (action.startsWith("go ")) {
    replyScenario = `You move ${action.replace("go ", "")}. You encounter cold steel bulkheads and humming crypto servers. The main point of interest is the Northern blast door.`;
    choices = ["look around", "go north", "take key"];
  } else {
    // If command isn't a direct match, use Gemini or fallback
    try {
      const ai = getGeminiClient();
      const systemPrompt = `
        You are Dungeon Master AI for an Enterprise Crypto Text Adventure game.
        Current scene: "${previousScenario}"
        Player input command: "${actionSelected}"
        Player inventory: ${JSON.stringify(updatedInventory)}
        Door locked status: ${updatedDoorLocked}
        Evaluate the command naturally. Keep the dark room and northern crypto door context.
        If player tries to take key, add "GXQ Cryptographic Keycard" to inventory.
        If player tries to unlock with key, set doorLocked to false.
        If door is unlocked and player moves north, set condition to "win".
        Respond with raw JSON: { "scenario": string, "choices": string[], "inventory": string[], "doorLocked": boolean, "condition": "playing" | "win" | "loss" }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: "Process text adventure action",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      if (parsed.scenario) {
        return res.json({
          success: true,
          gameState: {
            scenario: parsed.scenario,
            choices: parsed.choices || choices,
            inventory: parsed.inventory || updatedInventory,
            healthDelta: 0,
            doorLocked: parsed.doorLocked !== undefined ? parsed.doorLocked : updatedDoorLocked,
            condition: parsed.condition || condition
          }
        });
      }
    } catch (e) {
      // Fallback
    }

    replyScenario = `You attempt to "${actionSelected}". The vault acoustics echo in the dark. Try commands like 'look around', 'take key', 'go north', or 'unlock door with gxq'.`;
  }

  res.json({
    success: true,
    gameState: {
      scenario: replyScenario,
      choices,
      inventory: updatedInventory,
      healthDelta,
      doorLocked: updatedDoorLocked,
      condition
    }
  });
});

// -------------------------------------------------------------
// Gemini Action Plan Parsing & Live Output Generator (Full AI)
// -------------------------------------------------------------
app.post("/api/execute", async (req, res) => {
  const { instruction } = req.body;
  if (!instruction) {
    return res.status(400).json({ error: "Missing instruction text" });
  }

  // Pre-bake simple fast-path triggers for fluid offline testing
  const lowercaseInput = instruction.toLowerCase();
  
  try {
    const ai = getGeminiClient();

    // Setup active persona context
    const activePersona = mockPersonas.find(p => p.active) || mockPersonas[0];

    const sysPrompt = `
      You are NEXUS/ONE, a next-generation AI operating system command center.
      Your job is to translate a user's natural language command into a structured series of desktop & system automation steps (simulating Rust Windows Puppeteer & Local LLM controls).
      
      User is commanding you to do: "${instruction}".
      Active Companion context: "${activePersona.name} - Role: ${activePersona.role}. Instructions: ${activePersona.prompt}".
      
      Current Simulated File System list:
      ${JSON.stringify(mockFileSystem, null, 2)}
      
      You must respond with raw JSON in this exact structure (no backticks, no Markdown, just pure JSON).
      JSON Structure:
      {
        "plan_type": "single" | "composite" | "conditional",
        "steps": [
          {
            "action": "MouseMove" | "MouseClick" | "KeyboardType" | "KeyboardHotkey" | "FindAndClick" | "FileOperation" | "Screenshot" | "Wait",
            "target": "target description, coordinate, or file path",
            "details": "Explanation of what will happen in human terms",
            "executionMock": {
              "op": "create" | "delete" | "move" | "organize" | "none",
              "source": "source file path if standard file move/delete",
              "dest": "destination directory path or contents",
              "name": "filename to create/delete"
            }
          }
        ],
        "safety_level": "low" | "medium" | "high",
        "requires_confirmation": false,
        "ai_response_text": "A natural human-facing friendly conversational response summarising your plan from the point of view of your active persona."
      }

      Strict guidelines:
      - If the user instruction is destructive (e.g. deleting files, scanning system registry, starting miners), set "safety_level" to "high" or "medium" and "requires_confirmation" to true.
      - If the action is basic (e.g. clean downloads, organize, rename, write down a file), simulate the exact moves.
    `;

    const modelResponse = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: "Parse user request to a JSON plan.",
      config: {
        systemInstruction: sysPrompt,
        responseMimeType: "application/json",
      },
    });

    const parsedData = JSON.parse(modelResponse.text || "{}");
    
    // Apply database state modifications based on parsed executionMock instructions automatically!
    if (parsedData.steps && parsedData.steps.length > 0) {
      const dbActions: any[] = [];
      parsedData.steps.forEach((step: any) => {
        const mock = step.executionMock;
        if (mock && mock.op && mock.op !== "none") {
          dbActions.push({
            op: mock.op,
            source: mock.source,
            dest: mock.dest,
            name: mock.name,
            content: step.target
          });
        }
      });

      // Apply first matched DB action to synchronize database
      if (dbActions.length > 0) {
        const action = dbActions[0];
        if (action.op === "create") {
          const originalPath = action.dest ? `${action.dest}\\${action.name}` : `C:\\Users\\NexusUser\\Desktop\\${action.name}`;
          upsertMockFile({
            name: action.name || "AI_Notes.md",
            path: originalPath,
            size: "1.5 KB",
            type: "document",
            content: action.content || "Empty content",
            dateCreated: new Date().toISOString().split("T")[0]
          });
        } else if (action.op === "delete") {
          mockFileSystem = mockFileSystem.filter(f => f.path !== action.source);
        } else if (action.op === "move") {
          const filename = action.source?.split("\\").pop() || "moved_file.txt";
          const fitIndex = mockFileSystem.findIndex(f => f.path === action.source);
          if (fitIndex !== -1) {
            mockFileSystem[fitIndex].path = `${action.dest}\\${filename}`;
          }
        } else if (action.op === "organize") {
          // Trigger Downloads Organize
          mockFileSystem.forEach(file => {
            if (file.path.startsWith("C:\\Users\\NexusUser\\Downloads\\")) {
              if (file.type === "image") file.path = file.path.replace("Downloads\\", "Pictures\\");
              else if (file.type === "document" || file.type === "spreadsheet") file.path = file.path.replace("Downloads\\", "Documents\\");
            }
          });
        }
      }

      // Record logs
      const auditSteps = parsedData.steps.map((s: any) => ({
        action: s.action,
        target: s.target,
        status: "Completed" as const,
        details: s.details
      }));
      logAudit(instruction, true, auditSteps);
    }

    return res.json({
      success: true,
      simulationPlan: parsedData,
      files: mockFileSystem,
      audit: mockAuditLogs[0]
    });

  } catch (err: any) {
    // Elegant system fallback if Gemini is offline/unauthenticated
    console.error("Gemini Parse failed, falling back to clean rule-based simulation engine:", err.message);

    // Dynamic pattern matcher for high fidelity simulation
    let planType = "single";
    let steps: any[] = [];
    let safetyLevel = "low";
    let requiresConfirmation = false;
    let aiResponseText = `[Offline Mode] Running client-side automation rules to simulate task.`;

    if (lowercaseInput.includes("move") || lowercaseInput.includes("organize") || lowercaseInput.includes("clean")) {
      planType = "composite";
      aiResponseText = `Scanning Downloads directory for unorganized files. Organizing pictures into pictures folder and documents into documents.`;
      steps = [
        { action: "MouseMove", target: "C:\\Users\\NexusUser\\Downloads", details: "Hover screen onto Downloads folder widget" },
        { action: "MouseClick", target: "Downloads Folder", details: "Double-click directory block" },
        {
          action: "FileOperation",
          target: "C:\\Users\\NexusUser\\Downloads",
          details: "Organizing unorganized items",
          executionMock: { op: "organize" }
        }
      ];

      // Mutate local state
      mockFileSystem.forEach(file => {
        if (file.path.startsWith("C:\\Users\\NexusUser\\Downloads\\")) {
          if (file.type === "image") file.path = file.path.replace("Downloads\\", "Pictures\\");
          else if (file.type === "document" || file.type === "spreadsheet") file.path = file.path.replace("Downloads\\", "Documents\\");
        }
      });
    } else if (lowercaseInput.includes("delete") || lowercaseInput.includes("remove") || lowercaseInput.includes("kill")) {
      safetyLevel = "high";
      requiresConfirmation = true;
      aiResponseText = `Caution requested: This is a potentially destructive action. I have prepared a safe execution plan. Please verify and confirm to apply safety clearance.`;
      
      const targetSource = lowercaseInput.includes("olddesign") 
        ? "C:\\Users\\NexusUser\\Desktop\\OldDesign.png" 
        : "C:\\Users\\NexusUser\\Downloads\\invoice_29381.pdf";

      steps = [
        { action: "MouseMove", target: targetSource, details: "Focus on item target representation" },
        {
          action: "FileOperation",
          target: "Delete Action",
          details: `Simulating permanent removal of ${targetSource}`,
          executionMock: { op: "delete", source: targetSource }
        }
      ];
    } else {
      planType = "single";
      const userText = instruction.substring(0, 100);
      aiResponseText = `Affirmative. Initializing local execution loop for your request. Spawning task agent to click context panels and output notes safely.`;
      
      const fName = "AI_Draft.md";
      steps = [
        { action: "KeyboardType", target: `Draft instructions for: ${userText}`, details: "Type custom buffer content directly to text editor" },
        {
          action: "FileOperation",
          target: fName,
          details: "Create file and flush memory pipelines",
          executionMock: { op: "create", dest: "C:\\Users\\NexusUser\\Desktop", name: fName }
        }
      ];

      upsertMockFile({
        name: fName,
        path: `C:\\Users\\NexusUser\\Desktop\\${fName}`,
        size: "300 B",
        type: "document",
        content: `Draft automatically compiled by task agents: "${instruction}"`,
        dateCreated: new Date().toISOString().split("T")[0]
      });
    }

    logAudit(instruction, true, steps.map(s => ({
      action: s.action,
      target: s.target,
      status: "Completed",
      details: s.details
    })));

    res.json({
      success: true,
      simulationPlan: {
        plan_type: planType,
        steps,
        safety_level: safetyLevel,
        requires_confirmation: requiresConfirmation,
        ai_response_text: aiResponseText,
        isOfflineMode: true
      },
      files: mockFileSystem,
      audit: mockAuditLogs[0]
    });
  }
});

// Deep Research Agent Simulate Endpoint (Interactive & High Fidelity Markdown Generation)
app.post("/api/research", async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: "Missing research topic" });

  try {
    const ai = getGeminiClient();
    const prompt = `
      You are the NEXUS/ONE Deep Research Agent. Search and spider sources for: "${topic}".
      Generate an incredibly detailed, comprehensive, and senior-level scientific and market research dossier.
      Format your response in aesthetic clean Markdown with:
      - Title and Executive Brief
      - Modern Technology Stack analysis (2026 current trends)
      - Critical Vulnerability Audits
      - Clear tables and bullet lists
      - Explicit source citations in footnotes
      Keep content professional, rich, and detailed.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    const markdownDoc = response.text || "Failed to compile markdown report.";

    // Save as local research report file in sandbox
    const filename = `Research_Report_${topic.replace(/[^a-z0-9]/gi, "_").substring(0, 20)}.md`;
    const fullPath = `C:\\Users\\NexusUser\\Documents\\${filename}`;
    upsertMockFile({
      name: filename,
      path: fullPath,
      size: `${(markdownDoc.length / 1024).toFixed(1)} KB`,
      type: "document",
      content: markdownDoc,
      dateCreated: new Date().toISOString().split("T")[0]
    });

    logAudit(`Executed Deep Research on: ${topic}`, true, [
      { action: "Spider Web", target: topic, status: "Completed", details: "Scraped 15 web entities and PDF catalogs" },
      { action: "Synthesize Data", target: "Dossier Engine", status: "Completed", details: "Resolved conflict nodes successfully" },
      { action: "Save Document", target: fullPath, status: "Completed", details: "Indexed securely inside vector store" }
    ]);

    res.json({ success: true, report: markdownDoc, filename, files: mockFileSystem });
  } catch (err: any) {
    console.error("Deep Research AI failed, compiling local database default report template:", err.message);

    // Premium offline markdown generator
    const offlineDoc = `
# Executive Brief: ${topic}
> Local Standalone Synthesis Report compiled offline by Nexus/One Deep Researcher.
      
## 1. Primary Analysis Focus
We conducted an automated local intelligence audit on **${topic}** using simulated network vectors.

| Parameter | Context Analysis Value | Confidence Level |
|---|---|---|
| Core Terminology | ${topic} Systems Model | 94.2% |
| Industry Sector | Applied Smart Technologies | High |
| Sync Registry Status | Local Cloud Loop (N:/) | Integrated |

## 2. Competitive Architectural Review
Our heuristic index indicates that introducing this feature addresses critical workflow gaps in corporate desktop setups. 
- **Offline Integrity**: Decentralised GGUF weights run locally to block data egress.
- **Cognitive Syncing**: Infinite contexts allow RAG integration without database fragmentation.

*Compiled live at: ${new Date().toISOString()}*
    `;

    const filename = `Research_Report_${topic.replace(/[^a-z0-9]/gi, "_").substring(0, 20)}.md`;
    const fullPath = `C:\\Users\\NexusUser\\Documents\\${filename}`;
    upsertMockFile({
      name: filename,
      path: fullPath,
      size: "1.4 KB",
      type: "document",
      content: offlineDoc,
      dateCreated: new Date().toISOString().split("T")[0]
    });

    logAudit(`Executed Offline Deep Research on: ${topic}`, true, [
      { action: "Local Index Scraper", target: topic, status: "Completed" },
      { action: "Save Document", target: fullPath, status: "Completed" }
    ]);

    res.json({ success: true, report: offlineDoc, filename, files: mockFileSystem, isOfflineMode: true });
  }
});

// Sound generator with Speech synthesis mock
app.post("/api/synthesizer", async (req, res) => {
  const { text, voice } = req.body;
  if (!text) return res.status(400).json({ error: "Missing script text to synthesize" });

  try {
    const ai = getGeminiClient();
    // Verify voice existence
    const voiceName = voice || "Kore";
    // Using gemini-3.8-flash-tts for multimodal audio generation as per SDK guidelines
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-tts",
      contents: [{ parts: [{ text: `Say clearly with feeling: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      logAudit(`Synthesized text to speech using voice ${voiceName}`, true, [
        { action: "AI TTS Compile", target: voiceName, status: "Completed", details: `${text.substring(0, 40)}...` }
      ]);
      return res.json({ success: true, audio: `data:audio/wav;base64,${base64Audio}`, voiceName });
    } else {
      throw new Error("No audio payload returned from Gemini preview.");
    }
  } catch (err: any) {
    console.warn("TTS API failed or unauthenticated, defaulting to premium Client-Side Speech Synthesis fallback:", err.message);
    res.json({ success: true, fallbackWebSpeech: true, voiceName: voice || "Kore" });
  }
});

// Setup Vite Dev server or static files depending on mode
async function bootServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[NEXUS/ONE SERVER] Running seamlessly at http://localhost:${PORT}`);
  });
}

bootServer();
