import React, { useState, useEffect } from 'react';
import {
  Game,
  GraphicsSettings,
  GpuDriver,
  BoosterSettings,
  ControllerMode,
  ControllerLayout,
  MemoryCardFile,
} from './types/emulator';
import { INITIAL_GAMES } from './data/initialGames';
import { INITIAL_GPU_DRIVERS, detectGpuCapabilities, DetectedGpuInfo } from './services/gpuDetector';
import { MemoryCardService } from './services/memoryCardService';
import { emulatorAudio } from './services/audioSynthesizer';
import { HomeView } from './views/HomeView';
import { GameLibraryView } from './views/GameLibraryView';
import { ControllersView } from './views/ControllersView';
import { GraphicsView } from './views/GraphicsView';
import { GpuDriversView } from './views/GpuDriversView';
import { GameBoosterView } from './views/GameBoosterView';
import { CompatibilityView } from './views/CompatibilityView';
import { SettingsView } from './views/SettingsView';
import { GameCaseViewer3D } from './components/GameCaseViewer3D';
import { EmulatorGameScreen } from './components/EmulatorGameScreen';
import {
  Home,
  Disc,
  Gamepad2,
  Monitor,
  Cpu,
  Zap,
  CheckCircle,
  Settings,
  Upload,
  Play,
  Rotate3d,
} from 'lucide-react';

const DEFAULT_GRAPHICS: GraphicsSettings = {
  backend: 'vulkan',
  internalResolution: '2x',
  antiAliasing: 'fxaa',
  textureFiltering: 'anisotropic4x',
  vsync: true,
  widescreenMode: 'auto',
  shaderCompilation: 'async_ubershaders',
  postProcessing: 'none',
  precompileShaders: true,
  showFps: true,
  autoOptimize: true,
};

const DEFAULT_BOOSTER: BoosterSettings = {
  mode: 'balanced',
  targetFps: 60,
  ppcClockRatio: 1.0,
  jitAggressive: false,
  thermalThrottlingProtection: true,
  ramLimitMb: 4096,
  backgroundOptimization: true,
};

const DEFAULT_LAYOUT: ControllerLayout = {
  id: 'layout_default',
  name: 'Standard Pro Layout',
  mode: 'gamecube',
  opacity: 0.8,
  globalScale: 1.0,
  hapticFeedback: true,
  isLeftHanded: false,
  irPointerSensitivity: 7,
  shakeSensitivity: 6,
  buttons: [],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'home' | 'library' | 'controllers' | 'graphics' | 'gpu-drivers' | 'booster' | 'compatibility' | 'settings'
  >('home');

  const [games, setGames] = useState<Game[]>(INITIAL_GAMES);
  const [runningGame, setRunningGame] = useState<Game | null>(null);
  const [inspectGame, setInspectGame] = useState<Game | null>(null);

  const [graphicsSettings, setGraphicsSettings] = useState<GraphicsSettings>(DEFAULT_GRAPHICS);
  const [boosterSettings, setBoosterSettings] = useState<BoosterSettings>(DEFAULT_BOOSTER);
  const [controllerLayout, setControllerLayout] = useState<ControllerLayout>(DEFAULT_LAYOUT);
  const [controllerMode, setControllerMode] = useState<ControllerMode>('gamecube');

  const [detectedGpu, setDetectedGpu] = useState<DetectedGpuInfo>({
    renderer: 'Qualcomm Adreno 740 / Vulkan 1.3',
    vendor: 'Qualcomm',
    webglVersion: 'WebGL 2.0 (OpenGL ES 3.2)',
    maxTextureSize: 16384,
    anisotropicFiltering: true,
    maxAnisotropy: 16,
    vulkanApiSupported: true,
    vulkanVersion: 'Vulkan 1.3 (Adreno Turnip)',
    openGlEsVersion: 'OpenGL ES 3.2',
    deviceArchitecture: 'Adreno',
    recommendedDriverId: 'drv_turnip_24_3',
  });

  const [gpuDrivers, setGpuDrivers] = useState<GpuDriver[]>(INITIAL_GPU_DRIVERS);
  const [activeDriverId, setActiveDriverId] = useState<string>('drv_turnip_24_3');
  const [memcardFiles, setMemcardFiles] = useState<MemoryCardFile[]>([]);

  // Detect real GPU on client mount & load saves
  useEffect(() => {
    const info = detectGpuCapabilities();
    setDetectedGpu(info);
    if (info.recommendedDriverId) {
      setActiveDriverId(info.recommendedDriverId);
    }
    setMemcardFiles(MemoryCardService.getFiles());
  }, []);

  // Handlers
  const handleLaunchGame = (game: Game) => {
    emulatorAudio.playButtonSound();
    setRunningGame(game);
  };

  const handleExitGame = () => {
    setRunningGame(null);
  };

  const handleAddGame = (game: Game) => {
    setGames((prev) => [game, ...prev]);
  };

  const handleRemoveGame = (gameId: string) => {
    setGames((prev) => prev.filter((g) => g.id !== gameId));
  };

  const handleToggleFavorite = (gameId: string) => {
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, favorite: !g.favorite } : g))
    );
  };

  const handleUpdateGraphics = (updated: Partial<GraphicsSettings>) => {
    setGraphicsSettings((prev) => ({ ...prev, ...updated }));
  };

  const handleUpdateBooster = (updated: Partial<BoosterSettings>) => {
    setBoosterSettings((prev) => ({ ...prev, ...updated }));
  };

  const handleUpdateControllerLayout = (updated: Partial<ControllerLayout>) => {
    setControllerLayout((prev) => ({ ...prev, ...updated }));
  };

  const handleInstallCustomDriver = (driver: GpuDriver) => {
    setGpuDrivers((prev) => [driver, ...prev]);
    setActiveDriverId(driver.id);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* 3D Case Inspector Modal */}
      {inspectGame && (
        <GameCaseViewer3D
          game={inspectGame}
          onClose={() => setInspectGame(null)}
          onLaunch={(game) => {
            setInspectGame(null);
            handleLaunchGame(game);
          }}
        />
      )}

      {/* Running Emulation Viewport */}
      {runningGame && (
        <EmulatorGameScreen
          game={runningGame}
          graphics={graphicsSettings}
          booster={boosterSettings}
          controllerLayout={controllerLayout}
          onUpdateGraphics={handleUpdateGraphics}
          onUpdateBooster={handleUpdateBooster}
          onUpdateControllerLayout={handleUpdateControllerLayout}
          onExitGame={handleExitGame}
        />
      )}

      {/* Top Bar (Follows Top Bar Contract) */}
      <header className="sticky top-0 z-40 bg-[#07090e]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Wordmark */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Disc className="w-5 h-5 text-slate-950" />
          </div>
          <span className="text-lg font-black tracking-tight text-white">
            Ultra Wii <span className="text-cyan-400">Emulator</span>
          </span>
        </div>

        {/* Zone 2: Clean single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <button
            onClick={() => setActiveTab('home')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'home' ? 'text-cyan-400 font-bold' : 'hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'library' ? 'text-cyan-400 font-bold' : 'hover:text-white'
            }`}
          >
            Game Library
          </button>
          <button
            onClick={() => setActiveTab('controllers')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'controllers' ? 'text-cyan-400 font-bold' : 'hover:text-white'
            }`}
          >
            Controllers
          </button>
          <button
            onClick={() => setActiveTab('graphics')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'graphics' ? 'text-cyan-400 font-bold' : 'hover:text-white'
            }`}
          >
            Graphics
          </button>
          <button
            onClick={() => setActiveTab('gpu-drivers')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'gpu-drivers' ? 'text-cyan-400 font-bold' : 'hover:text-white'
            }`}
          >
            GPU Drivers
          </button>
          <button
            onClick={() => setActiveTab('booster')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'booster' ? 'text-cyan-400 font-bold' : 'hover:text-white'
            }`}
          >
            Game Booster
          </button>
          <button
            onClick={() => setActiveTab('compatibility')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'compatibility' ? 'text-cyan-400 font-bold' : 'hover:text-white'
            }`}
          >
            Compatibility
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'settings' ? 'text-cyan-400 font-bold' : 'hover:text-white'
            }`}
          >
            Settings
          </button>
        </nav>

        {/* Zone 3: Primary Action CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleLaunchGame(games[0])}
            className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95 transition-all whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>Quick Launch</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
        {activeTab === 'home' && (
          <HomeView
            games={games}
            onLaunchGame={handleLaunchGame}
            onOpenInspect3D={(g) => setInspectGame(g)}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            currentBackend={graphicsSettings.backend}
            currentBoosterMode={boosterSettings.mode}
            gpuName={detectedGpu.renderer}
          />
        )}

        {activeTab === 'library' && (
          <GameLibraryView
            games={games}
            onLaunchGame={handleLaunchGame}
            onOpenInspect3D={(g) => setInspectGame(g)}
            onAddGame={handleAddGame}
            onRemoveGame={handleRemoveGame}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {activeTab === 'controllers' && (
          <ControllersView
            currentMode={controllerMode}
            onSetMode={setControllerMode}
            layout={controllerLayout}
            onUpdateLayout={handleUpdateControllerLayout}
            onResetLayout={() => setControllerLayout(DEFAULT_LAYOUT)}
          />
        )}

        {activeTab === 'graphics' && (
          <GraphicsView
            settings={graphicsSettings}
            onUpdate={handleUpdateGraphics}
            detectedGpu={detectedGpu.renderer}
          />
        )}

        {activeTab === 'gpu-drivers' && (
          <GpuDriversView
            detectedInfo={detectedGpu}
            drivers={gpuDrivers}
            activeDriverId={activeDriverId}
            onSelectDriver={setActiveDriverId}
            onInstallCustomDriver={handleInstallCustomDriver}
            currentBackend={graphicsSettings.backend}
          />
        )}

        {activeTab === 'booster' && (
          <GameBoosterView
            settings={boosterSettings}
            onUpdate={handleUpdateBooster}
            fps={60.0}
          />
        )}

        {activeTab === 'compatibility' && <CompatibilityView />}

        {activeTab === 'settings' && (
          <SettingsView
            memcardFiles={memcardFiles}
            onRefreshMemcard={() => setMemcardFiles(MemoryCardService.getFiles())}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Thumb Zone) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-5 items-center h-16 px-1">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'home' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-1">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'library' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Disc className="w-5 h-5" />
          <span className="text-[10px] mt-1">Library</span>
        </button>

        <button
          onClick={() => setActiveTab('controllers')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'controllers' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Gamepad2 className="w-5 h-5" />
          <span className="text-[10px] mt-1">Controls</span>
        </button>

        <button
          onClick={() => setActiveTab('graphics')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'graphics' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Monitor className="w-5 h-5" />
          <span className="text-[10px] mt-1">Graphics</span>
        </button>

        <button
          onClick={() => setActiveTab('gpu-drivers')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'gpu-drivers' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Cpu className="w-5 h-5" />
          <span className="text-[10px] mt-1">Drivers</span>
        </button>
      </div>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Ultra Wii Emulator · Dolphin Core Emulation Architecture · Android 13 / ColorOS 13</span>
          <span>Licensed under GNU General Public License v2+ (GPL-2.0-or-later)</span>
        </div>
      </footer>
    </div>
  );
}
