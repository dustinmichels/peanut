export type LightingPresetId = 'studio' | 'golden' | 'daylight' | 'dramatic';

export type MaterialModeId = 'fleece' | 'smooth' | 'wireframe';

export type ViewPresetId = 'photo' | 'front' | 'face' | 'feet' | 'side';

export interface PeanutSceneConfig {
  lighting: LightingPresetId;
  material: MaterialModeId;
  autoRotate: boolean;
  isBreathing: boolean;
  fuzzIntensity: number;
}

export interface ViewPresetInfo {
  id: ViewPresetId;
  label: string;
  description: string;
  position: [number, number, number];
  target: [number, number, number];
}

export interface LightingPresetInfo {
  id: LightingPresetId;
  label: string;
  description: string;
  bgGradient: string;
}
