export type PlantStatus = "dead" | "dying" | "stressed" | "healthy";

export type LetterTone = "last_words" | "rescue_note";

export interface PlantSignalInput {
  imageName?: string;
  plantName?: string;
  symptoms: string[];
  roomLight: "low" | "medium" | "bright" | "direct";
  watering: "forgotten" | "weekly" | "daily" | "unknown";
  potDrainage: "yes" | "no" | "unknown";
  daysOwned?: number;
  notes?: string;
}

export interface RescueItem {
  id: string;
  label: string;
  why: string;
  priority: "must" | "nice";
  buyHint: string;
}

export interface RescueStep {
  id: string;
  title: string;
  detail: string;
  timing: string;
}

export interface DiagnosisResult {
  id: string;
  detectedSpecies: string;
  nickname: string;
  confidence: number;
  status: PlantStatus;
  healthScore: number;
  deathCause: string;
  evidence: string[];
  letterTone: LetterTone;
  letterTitle: string;
  letterBody: string;
  rescueItems: RescueItem[];
  rescueSteps: RescueStep[];
  tags: string[];
  createdAt: string;
}
