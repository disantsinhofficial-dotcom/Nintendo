import React, { useEffect, useRef, useState } from 'react';
import { Game, GraphicsSettings, ControllerMode, ControllerLayout, BoosterSettings } from '../types/emulator';
import { ThreeEmulatorRenderer, EngineInputState, GameEngineState } from '../services/gameplayEngines';
import { emulatorAudio } from '../services/audioSynthesizer';
import { TouchController } from './TouchController';
import { InGameOverlay } from './InGameOverlay';

interface EmulatorGameScreenProps {
  game: Game;
  graphics: GraphicsSettings;
  booster: BoosterSettings;
  controllerLayout: ControllerLayout;
  onUpdateGraphics: (partial: Partial<GraphicsSettings>) => void;
  onUpdateBooster: (partial: Partial<BoosterSettings>) => void;
  onUpdateControllerLayout: (partial: Partial<ControllerLayout>) => void;
  onExitGame: () => void;
}

export const EmulatorGameScreen: React.FC<EmulatorGameScreenProps> = ({
  game,
  graphics,
  booster,
  controllerLayout,
  onUpdateGraphics,
  onUpdateBooster,
  onUpdateControllerLayout,
  onExitGame,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ThreeEmulatorRenderer | null>(null);

  const [controllerMode, setControllerMode] = useState<ControllerMode>(
    game.platform === 'wii' ? 'wiimote' : 'gamecube'
  );
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [fps, setFps] = useState(60.0);
  const [frameTimeMs, setFrameTimeMs] = useState(16.6);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [engineState, setEngineState] = useState<GameEngineState | null>(null);

  // Initialize Three.js WebGL2 Emulation Renderer & play startup chime
  useEffect(() => {
    if (!canvasRef.current) return;

    // Play startup chime
    if (game.platform === 'wii') {
      emulatorAudio.playWiiBootSound();
    } else {
      emulatorAudio.playGameCubeBootSound();
    }

    const renderer = new ThreeEmulatorRenderer(canvasRef.current, game, (state) => {
      setEngineState(state);
    });
    rendererRef.current = renderer;

    const handleResize = () => {
      if (canvasRef.current && rendererRef.current) {
        rendererRef.current.resize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // FPS loop calculation
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsInterval: NodeJS.Timeout;

    const measureFps = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        const calculatedFps = (frameCount * 1000) / (now - lastTime);
        setFps(calculatedFps);
        setFrameTimeMs(1000 / Math.max(1, calculatedFps));
        frameCount = 0;
        lastTime = now;
      }
    };

    const intervalId = setInterval(measureFps, 16);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(intervalId);
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [game]);

  // Handle Input Changes from touch/gamepad
  const handleInputChange = (input: EngineInputState) => {
    if (rendererRef.current) {
      rendererRef.current.updateWithInput(input);
    }
  };

  const handleSetSpeedMultiplier = (mult: number) => {
    setSpeedMultiplier(mult);
    if (rendererRef.current) {
      rendererRef.current.setSpeedFactor(mult);
    }
  };

  const handleCaptureScreenshot = () => {
    if (rendererRef.current) {
      const dataUrl = rendererRef.current.captureScreenshot();
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${game.gameId}_screenshot_${Date.now()}.jpg`;
      a.click();
    }
  };

  const handleResetGame = () => {
    if (game.platform === 'wii') {
      emulatorAudio.playWiiBootSound();
    } else {
      emulatorAudio.playGameCubeBootSound();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden select-none touch-none">
      {/* 3D Emulation Canvas */}
      <div className="relative w-full h-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className={`w-full h-full object-contain ${
            graphics.postProcessing === 'crt' ? 'crt-scanlines' : ''
          } ${graphics.postProcessing === 'bloom' ? 'bloom-glow' : ''}`}
        />

        {/* Game Status HUD (In-game bottom center) */}
        {engineState && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-10 bg-slate-950/70 border border-slate-800/80 px-4 py-1 rounded-full text-xs font-mono font-bold text-cyan-300 backdrop-blur-sm shadow-md">
            {engineState.gameStatusText}
          </div>
        )}

        {/* Touchscreen Controller Overlay */}
        {isControlsVisible && (
          <TouchController
            mode={controllerMode}
            layout={controllerLayout}
            onInputChange={handleInputChange}
            isEditMode={isEditMode}
            onToggleEditMode={() => setIsEditMode(!isEditMode)}
          />
        )}

        {/* Floating Quick Settings Menu & Performance Telemetry HUD */}
        <InGameOverlay
          game={game}
          graphics={graphics}
          booster={booster}
          currentControllerMode={controllerMode}
          fps={fps}
          frameTimeMs={frameTimeMs}
          speedMultiplier={speedMultiplier}
          onSetSpeedMultiplier={handleSetSpeedMultiplier}
          onSwitchControllerMode={setControllerMode}
          onUpdateGraphics={onUpdateGraphics}
          onUpdateBooster={onUpdateBooster}
          onCaptureScreenshot={handleCaptureScreenshot}
          onResetGame={handleResetGame}
          onExitGame={onExitGame}
          isControlsVisible={isControlsVisible}
          onToggleControlsVisible={() => setIsControlsVisible(!isControlsVisible)}
          onToggleEditControls={() => setIsEditMode(true)}
        />
      </div>
    </div>
  );
};
