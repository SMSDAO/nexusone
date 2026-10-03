import cyberArchitectImg from "./assets/images/cyber_architect_1790855207304.jpg";
import cryptoOperatorImg from "./assets/images/crypto_operator_1790855219793.jpg";
import neuralSentinelImg from "./assets/images/neural_sentinel_1790855232941.jpg";
import quantumScholarImg from "./assets/images/quantum_scholar_1790855252132.jpg";

export interface GeneratedAvatarPreset {
  id: string;
  name: string;
  roleMatch: string;
  image: string;
  color: string;
  theme: "blue" | "orange" | "red" | "yellow" | "purple";
}

export const PRESET_AI_AVATARS: GeneratedAvatarPreset[] = [
  {
    id: "avatar_cyber_architect",
    name: "Architect Cyan-01",
    roleMatch: "AI Workspace Operator / Systems Architect",
    image: cyberArchitectImg,
    color: "#00e5ff",
    theme: "blue"
  },
  {
    id: "avatar_crypto_operator",
    name: "Cipher Sol-09",
    roleMatch: "Web3 Crypto Security & Key Enclave",
    image: cryptoOperatorImg,
    color: "#ff7700",
    theme: "orange"
  },
  {
    id: "avatar_neural_sentinel",
    name: "Aegis Red-X",
    roleMatch: "Security Clearance & Audit Sentinel",
    image: neuralSentinelImg,
    color: "#ff0055",
    theme: "red"
  },
  {
    id: "avatar_quantum_scholar",
    name: "Nova Lux-V",
    roleMatch: "Quantum LLM & Neural Synthesizer",
    image: quantumScholarImg,
    color: "#ffd700",
    theme: "yellow"
  }
];

/**
 * Generate a procedural enterprise SVG cyberpunk avatar customized with name, role, and cybernetic glyphs
 */
export function generateProceduralAvatar(name: string, role: string, theme: "cyan" | "orange" | "crimson" | "amber" | "purple" = "cyan"): string {
  const initials = (name || "OP")
    .split(" ")
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "NX";

  const colorPalettes = {
    cyan: { primary: "#00e5ff", secondary: "#0055ff", glow: "rgba(0, 229, 255, 0.4)", text: "#e0f7fa" },
    orange: { primary: "#ff7700", secondary: "#ff3700", glow: "rgba(255, 119, 0, 0.4)", text: "#fff3e0" },
    crimson: { primary: "#ff0055", secondary: "#990033", glow: "rgba(255, 0, 85, 0.4)", text: "#ffebee" },
    amber: { primary: "#ffd700", secondary: "#ff9100", glow: "rgba(255, 215, 0, 0.4)", text: "#fffde7" },
    purple: { primary: "#c084fc", secondary: "#7e22ce", glow: "rgba(192, 132, 252, 0.4)", text: "#f3e8ff" }
  };

  const p = colorPalettes[theme] || colorPalettes.cyan;
  const roleCode = (role || "OPERATOR").slice(0, 10).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#050814" />
        <stop offset="100%" stop-color="#0a1224" />
      </linearGradient>
      <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.primary}" />
        <stop offset="100%" stop-color="${p.secondary}" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- Cyber Hexagon Card Base -->
    <rect width="200" height="200" rx="28" fill="url(#bgGrad)" stroke="${p.primary}" stroke-width="2" stroke-opacity="0.4" />
    
    <!-- Circuit grid lines -->
    <path d="M 20 50 L 50 50 L 70 30 L 150 30" stroke="${p.primary}" stroke-width="1.5" stroke-opacity="0.3" fill="none" />
    <path d="M 180 150 L 150 150 L 130 170 L 50 170" stroke="${p.primary}" stroke-width="1.5" stroke-opacity="0.3" fill="none" />
    <circle cx="70" cy="30" r="3" fill="${p.primary}" />
    <circle cx="130" cy="170" r="3" fill="${p.primary}" />

    <!-- Central Neural Visor Ring -->
    <circle cx="100" cy="95" r="54" fill="#040711" stroke="url(#neonGrad)" stroke-width="3" filter="url(#glow)" />
    <circle cx="100" cy="95" r="44" fill="#0a1222" stroke="${p.primary}" stroke-width="1" stroke-dasharray="4,3" stroke-opacity="0.6" />

    <!-- Optical HUD Visor Horizon -->
    <rect x="58" y="86" width="84" height="18" rx="9" fill="url(#neonGrad)" opacity="0.85" filter="url(#glow)" />
    <line x1="62" y1="95" x2="138" y2="95" stroke="#ffffff" stroke-width="1.5" opacity="0.9" />

    <!-- Avatar Identity Monogram -->
    <text x="100" y="102" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle" letter-spacing="1">
      ${initials}
    </text>

    <!-- Role Tech Stamp -->
    <rect x="35" y="152" width="130" height="22" rx="6" fill="#050914" stroke="${p.primary}" stroke-width="1" stroke-opacity="0.7" />
    <text x="100" y="167" font-family="monospace" font-weight="700" font-size="9" fill="${p.primary}" text-anchor="middle" letter-spacing="1.5">
      ${roleCode}
    </text>

    <!-- Biometric Status Node -->
    <circle cx="166" cy="34" r="4" fill="${p.primary}" filter="url(#glow)" />
    <text x="156" y="37" font-family="monospace" font-size="8" fill="${p.text}" text-anchor="end" opacity="0.7">AI•SYNC</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
