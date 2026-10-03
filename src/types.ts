export interface MockFile {
  name: string;
  path: string;
  size: string;
  type: string;
  content?: string;
  dateCreated: string;
}

export interface ProcessItem {
  pid: number;
  name: string;
  cpu: number;
  memory: string;
  status: "Running" | "Suspended" | "Idle";
}

export interface AuditLog {
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

export interface Persona {
  id: string;
  name: string;
  avatar: string;
  role: string;
  prompt: string;
  active: boolean;
}

export interface PuppetStep {
  action: string;
  target: string;
  details?: string;
}

export interface PuppetPlan {
  plan_type: string;
  steps: PuppetStep[];
  safety_level: string;
  requires_confirmation: boolean;
  ai_response_text: string;
  isOfflineMode?: boolean;
}

export interface GGUFModelConfig {
  id: string;
  name: string;
  filename: string;
  quantization: string;
  params: string;
  vram: string;
  specialty: string;
  temperature: number;
  contextWindow: number;
  topP?: number;
}
