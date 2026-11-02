import React, { useState } from 'react';
import { Game, GraphicsSettings, ControllerMode, BoosterSettings } from '../types/emulator';
import { MemoryCardService } from '../services/memoryCardService';
import { emulatorAudio } from '../services/audioSynthesizer';
import {
  Menu,
  Play,
  Save,
  Download,
  FastForward,
  Camera,
  RotateCcw,
  LogOut,
  Sliders,
  Gauge,
  Zap,
  Volume2,
  VolumeX,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

interface InGameOverlayProps {
  game: Game;
  graphics: GraphicsSettings;
  booster: BoosterSettings;
  currentControllerMode: ControllerMode;
  fps: number;
  frameTimeMs: number;
  speedMultiplier: number;
  onSetSpeedMultiplier: (mult: number) => void;
  onSwitchControllerMode: (mode: ControllerMode) => void;
  onUpdateGraphics: (partial: Partial<GraphicsSettings>) => void;
  onUpdateBooster: (partial: Partial<BoosterSettings>) => void;
  onCaptureScreenshot: () => void;
  onResetGame: () => void;
  onExitGame: () => void;
  isControlsVisible: boolean;
  onToggleControlsVisible: () => void;
  onToggleEditControls: () => void;
}

export const InGameOverlay: React.FC<InGameOverlayProps> = ({
  game,
  graphics,
  booster,
  currentControllerMode,
  fps,
  frameTimeMs,
  speedMultiplier,
  onSetSpeedMultiplier,
  onSwitchControllerMode,
  onUpdateGraphics,
  onUpdateBooster,
  onCaptureScreenshot,
  onResetGame,
  onExitGame,
  isControlsVisible,
  onToggleControlsVisible,
  onToggleEditControls,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [activeTab, setActiveTab] = useState<'main' | 'states' | 'graphics' | 'boost'>('main');
  const [isMuted, setIsMuted] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleSaveState = () => {
    emulatorAudio.playActionSound('score');
    MemoryCardService.saveState({
      slot: selectedSlot,
      gameId: game.id,
      timestamp: new Date().toLocaleTimeString(),
      screenshotUrl: '',
      sizeKb: 4096,
      description: `State #${selectedSlot} saved`,
    });
    showToast(`State saved to Slot ${selectedSlot}!`);
  };

  const handleLoadState = () => {
    emulatorAudio.playActionSound('boost');
    showToast(`State restored from Slot ${selectedSlot}`);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    emulatorAudio.setMuted(next);
    showToast(next ? 'Audio Muted' : 'Audio Unmuted');
  };

  return (
    <>
      {/* Real-time Telemetry HUD (Top Left) */}
      {graphics.showFps && (
        <div className="absolute top-2 left-2 z-30 pointer-events-none flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 px-2.5 py-1 rounded-md text-[11px] font-mono text-cyan-300 backdrop-blur-sm">
          <span className="font-bold text-emerald-400">{fps.toFixed(1)} FPS</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">{frameTimeMs.toFixed(1)}ms</span>
          <span className="text-slate-500">|</span>
          <span className={speedMultiplier > 1 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
            {Math.round((fps / 60) * 100 * speedMultiplier)}%
          </span>
          {speedMultiplier > 1 && (
            <span className="text-yellow-400 font-bold">({speedMultiplier}x FF)</span>
          )}
        </div>
      )}

      {/* Floating Menu Trigger Button (Top Right) */}
      <div className="absolute top-2 right-2 z-30 pointer-events-auto flex items-center gap-1.5">
        <button
          onClick={onToggleControlsVisible}
          title="Toggle On-Screen Touch Controls"
          className="w-8 h-8 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 flex items-center justify-center backdrop-blur-sm shadow-md transition-colors"
        >
          {isControlsVisible ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
        </button>

        <button
          onClick={() => {
            emulatorAudio.playButtonSound();
            setIsMenuOpen(true);
          }}
          className="px-3 py-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-800 border border-cyan-500/50 text-cyan-300 flex items-center gap-1.5 text-xs font-semibold backdrop-blur-sm shadow-lg shadow-cyan-950/40 transition-all active:scale-95"
        >
          <Menu className="w-4 h-4 text-cyan-400" />
          <span>Quick Menu</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-cyan-950/95 border border-cyan-400/80 text-cyan-200 px-4 py-2 rounded-xl text-xs font-medium backdrop-blur-md shadow-xl animate-fade-in pointer-events-none">
          {notification}
        </div>
      )}

      {/* In-Game Floating Quick Settings Modal */}
      {isMenuOpen && (
        <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">{game.title}</h3>
                  <p className="text-[11px] text-cyan-400 font-mono">
                    {game.platform.toUpperCase()} · {game.gameId} · DOLPHIN ENGINE ACTIVE
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex items-center gap-1 p-2 bg-slate-950 border-b border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('main')}
                className={`flex-1 py-1.5 font-medium rounded-lg transition-colors ${
                  activeTab === 'main' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Controls & Speed
              </button>
              <button
                onClick={() => setActiveTab('states')}
                className={`flex-1 py-1.5 font-medium rounded-lg transition-colors ${
                  activeTab === 'states' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Save States
              </button>
              <button
                onClick={() => setActiveTab('graphics')}
                className={`flex-1 py-1.5 font-medium rounded-lg transition-colors ${
                  activeTab === 'graphics' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Graphics
              </button>
              <button
                onClick={() => setActiveTab('boost')}
                className={`flex-1 py-1.5 font-medium rounded-lg transition-colors ${
                  activeTab === 'boost' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Booster
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* TAB 1: MAIN */}
              {activeTab === 'main' && (
                <div className="space-y-4">
                  {/* Primary Resume Button */}
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.99] transition-all"
                  >
                    <Play className="w-5 h-5 fill-slate-950" />
                    <span>Resume Game</span>
                  </button>

                  {/* Fast Forward Multiplier */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <FastForward className="w-4 h-4 text-amber-400" />
                        Emulation Speed
                      </span>
                      <span className="text-cyan-400 font-mono font-bold">{speedMultiplier}x Normal</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 1.5, 2, 4].map((mult) => (
                        <button
                          key={mult}
                          onClick={() => {
                            onSetSpeedMultiplier(mult);
                            showToast(`Speed set to ${mult}x`);
                          }}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            speedMultiplier === mult
                              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {mult}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Controller Switcher */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                    <span className="text-xs text-slate-300 font-medium block">Active Touch Controller</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          onSwitchControllerMode('gamecube');
                          showToast('Switched to GameCube Pad');
                        }}
                        className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                          currentControllerMode === 'gamecube'
                            ? 'bg-purple-600 text-white border border-purple-400'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        <span>GameCube Pad</span>
                      </button>
                      <button
                        onClick={() => {
                          onSwitchControllerMode('wiimote');
                          showToast('Switched to Wii Remote + Nunchuk');
                        }}
                        className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                          currentControllerMode === 'wiimote'
                            ? 'bg-cyan-600 text-white border border-cyan-400'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        <span>Wii Remote + Nunchuk</span>
                      </button>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onToggleEditControls();
                        }}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Customize Button Layout</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Utility Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        onCaptureScreenshot();
                        showToast('Screenshot saved to Gallery!');
                      }}
                      className="py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-700"
                    >
                      <Camera className="w-4 h-4 text-cyan-400" />
                      <span>Take Screenshot</span>
                    </button>
                    <button
                      onClick={toggleMute}
                      className="py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-700"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                      <span>{isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: SAVE STATES */}
              {activeTab === 'states' && (
                <div className="space-y-4">
                  <span className="text-xs text-slate-400 block">
                    Save states capture the exact instantaneous state of the PowerPC CPU registers, TEV FIFO, and 24MB Main RAM.
                  </span>

                  {/* Slot Selector */}
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                          selectedSlot === slot
                            ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                            : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <span>Slot {slot}</span>
                      </button>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={handleSaveState}
                      className="py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save to Slot {selectedSlot}</span>
                    </button>
                    <button
                      onClick={handleLoadState}
                      className="py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
                    >
                      <Download className="w-4 h-4" />
                      <span>Load from Slot {selectedSlot}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: GRAPHICS */}
              {activeTab === 'graphics' && (
                <div className="space-y-4 text-xs">
                  {/* Resolution */}
                  <div>
                    <label className="text-slate-300 font-medium mb-1.5 block">Internal Resolution Upscaling</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['1x', '1.5x', '2x', '3x'] as const).map((res) => (
                        <button
                          key={res}
                          onClick={() => {
                            onUpdateGraphics({ internalResolution: res });
                            showToast(`Resolution set to ${res}`);
                          }}
                          className={`py-2 rounded-lg font-bold ${
                            graphics.internalResolution === res
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {res} {res === '1x' ? '(480p)' : res === '2x' ? '(1080p)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Post-Processing Shaders */}
                  <div>
                    <label className="text-slate-300 font-medium mb-1.5 block">Post-Processing Filter</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'none', label: 'None (Clean)' },
                        { id: 'crt', label: 'CRT Trinitron' },
                        { id: 'bloom', label: 'HDR Bloom' },
                      ].map((shader) => (
                        <button
                          key={shader.id}
                          onClick={() => {
                            onUpdateGraphics({ postProcessing: shader.id as any });
                            showToast(`Shader: ${shader.label}`);
                          }}
                          className={`py-2 rounded-lg font-medium ${
                            graphics.postProcessing === shader.id
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {shader.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* V-Sync & FPS Display */}
                  <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-300 font-medium">Show FPS & Frame Time</span>
                    <button
                      onClick={() => onUpdateGraphics({ showFps: !graphics.showFps })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        graphics.showFps ? 'bg-cyan-500' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          graphics.showFps ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: BOOSTER */}
              {activeTab === 'boost' && (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      PowerPC CPU Clock Emulation
                    </span>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Underclock (Battery)</span>
                      <span className="text-cyan-400 font-bold">{Math.round(booster.ppcClockRatio * 100)}% ({Math.round(booster.ppcClockRatio * 729)} MHz)</span>
                      <span>Overclock</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="1.3"
                      step="0.05"
                      value={booster.ppcClockRatio}
                      onChange={(e) => onUpdateBooster({ ppcClockRatio: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(['performance', 'balanced', 'battery'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          onUpdateBooster({ mode });
                          showToast(`Preset: ${mode.toUpperCase()}`);
                        }}
                        className={`py-2.5 rounded-xl font-bold capitalize ${
                          booster.mode === mode
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <button
                onClick={() => {
                  onResetGame();
                  setIsMenuOpen(false);
                  showToast('Game Reset');
                }}
                className="px-3.5 py-2 text-slate-400 hover:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Game</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onExitGame();
                }}
                className="px-4 py-2 bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit to Library</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
