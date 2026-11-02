export type Platform = 'wii' | 'gamecube';

export type DiscFormat = 'ISO' | 'WBFS' | 'RVZ' | 'GCM' | 'CISO';

export type CompatibilityRating = 'Perfect' | 'Playable' | 'In-Game' | 'Intro' | 'Broken';

export interface Game {
  id: string;
  gameId: string; // 6-char Disc ID, e.g. "RMCE01", "GALE01"
  title: string;
  platform: Platform;
  region: 'NTSC-U' | 'PAL' | 'NTSC-J';
  publisher: string;
  releaseYear: number;
  coverImage: string;
  sizeBytes: number;
  sizeFormatted: string;
  discFormat: DiscFormat;
  lastPlayed?: string;
  playTimeMinutes: number;
  favorite: boolean;
  compatibilityRating: CompatibilityRating;
  recommendedBackend: 'vulkan' | 'opengles';
  internalResPreset?: '1x' | '1.5x' | '2x' | '3x' | '4x';
  isCustomImport?: boolean;
  notes?: string;
}

export type GraphicsBackend = 'vulkan' | 'opengles' | 'software';

export type InternalResolution = '1x' | '1.5x' | '2x' | '3x' | '4x';

export type AntiAliasing = 'none' | 'fxaa' | 'msaa2x' | 'msaa4x' | 'msaa8x';

export type TextureFiltering = 'bilinear' | 'trilinear' | 'anisotropic2x' | 'anisotropic4x' | 'anisotropic8x' | 'anisotropic16x';

export type WidescreenMode = 'auto' | '16_9' | '4_3' | 'widescreen_hack';

export type ShaderCompilation = 'sync' | 'async_skip' | 'async_ubershaders' | 'specialized';

export type PostProcessing = 'none' | 'crt' | 'bloom' | 'cel_shade' | 'vibrant';

export interface GraphicsSettings {
  backend: GraphicsBackend;
  internalResolution: InternalResolution;
  antiAliasing: AntiAliasing;
  textureFiltering: TextureFiltering;
  vsync: boolean;
  widescreenMode: WidescreenMode;
  shaderCompilation: ShaderCompilation;
  postProcessing: PostProcessing;
  precompileShaders: boolean;
  showFps: boolean;
  autoOptimize: boolean;
}

export interface GpuDriver {
  id: string;
  name: string;
  version: string;
  vendor: string;
  type: 'system' | 'turnip' | 'adreno_prop' | 'custom';
  vulkanApiVersion: string;
  openglVersion: string;
  stability: 'High' | 'Experimental' | 'Caution';
  recommended: boolean;
  description: string;
  packageSize: string;
}

export type BoosterMode = 'performance' | 'balanced' | 'battery';

export interface BoosterSettings {
  mode: BoosterMode;
  targetFps: 30 | 60 | 120;
  ppcClockRatio: number; // 0.8x to 1.3x
  jitAggressive: boolean;
  thermalThrottlingProtection: boolean;
  ramLimitMb: number;
  backgroundOptimization: boolean;
}

export type ControllerMode = 'gamecube' | 'wiimote' | 'classic';

export interface TouchButtonConfig {
  id: string;
  label: string;
  x: number; // percentage from left (0 - 100)
  y: number; // percentage from top (0 - 100)
  size: number; // pixels diameter
  color: string;
  type: 'button' | 'stick' | 'trigger' | 'dpad';
}

export interface ControllerLayout {
  id: string;
  name: string;
  mode: ControllerMode;
  opacity: number; // 0.1 to 1.0
  globalScale: number; // 0.6 to 1.4
  hapticFeedback: boolean;
  isLeftHanded: boolean;
  irPointerSensitivity: number; // 1 to 10
  shakeSensitivity: number; // 1 to 10
  buttons: TouchButtonConfig[];
}

export interface SaveState {
  slot: number;
  gameId: string;
  timestamp: string;
  screenshotUrl: string;
  sizeKb: number;
  description: string;
}

export interface MemoryCardFile {
  id: string;
  gameId: string;
  gameTitle: string;
  fileName: string;
  blocks: number;
  savedAt: string;
  comments: string;
}

export interface GameCompatibilityItem {
  id: string;
  title: string;
  platform: Platform;
  rating: CompatibilityRating;
  dolphinVersion: string;
  recommendedBackend: 'Vulkan' | 'OpenGL ES';
  notes: string;
  testedGpu: string;
}
