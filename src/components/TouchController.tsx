import React, { useState, useEffect, useRef } from 'react';
import { ControllerMode, ControllerLayout } from '../types/emulator';
import { EngineInputState } from '../services/gameplayEngines';
import { emulatorAudio } from '../services/audioSynthesizer';
import { Move, Check, RotateCcw, Sliders, Smartphone, Gamepad2 } from 'lucide-react';

interface TouchControllerProps {
  mode: ControllerMode;
  layout: ControllerLayout;
  onInputChange: (input: EngineInputState) => void;
  onUpdateLayout?: (updated: ControllerLayout) => void;
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
}

export const TouchController: React.FC<TouchControllerProps> = ({
  mode,
  layout,
  onInputChange,
  onUpdateLayout,
  isEditMode = false,
  onToggleEditMode,
}) => {
  const [inputState, setInputState] = useState<EngineInputState>({
    stickX: 0,
    stickY: 0,
    cStickX: 0,
    cStickY: 0,
    btnA: false,
    btnB: false,
    btnX: false,
    btnY: false,
    btnStart: false,
    btnL: 0,
    btnR: 0,
    btnZ: false,
    dpadUp: false,
    dpadDown: false,
    dpadLeft: false,
    dpadRight: false,
    pointerX: 50,
    pointerY: 50,
    shake: false,
    nunchukStickX: 0,
    nunchukStickY: 0,
    nunchukC: false,
    nunchukZ: false,
  });

  const [connectedGamepadName, setConnectedGamepadName] = useState<string | null>(null);

  // Send input changes upstream
  const updateInput = (partial: Partial<EngineInputState>) => {
    setInputState((prev) => {
      const next = { ...prev, ...partial };
      onInputChange(next);
      return next;
    });
  };

  const triggerHaptic = () => {
    if (layout.hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(12);
      } catch (e) {
        // ignore
      }
    }
  };

  // Physical Gamepad API polling
  useEffect(() => {
    let animId: number;
    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const pad = gamepads[0] || gamepads[1];
      if (pad) {
        setConnectedGamepadName(pad.id);
        const aPressed = pad.buttons[0]?.pressed || false;
        const bPressed = pad.buttons[1]?.pressed || false;
        const xPressed = pad.buttons[2]?.pressed || false;
        const yPressed = pad.buttons[3]?.pressed || false;
        const lPressed = pad.buttons[4]?.value || 0;
        const rPressed = pad.buttons[5]?.value || 0;
        const zPressed = pad.buttons[6]?.pressed || false;
        const startPressed = pad.buttons[9]?.pressed || false;
        const dUp = pad.buttons[12]?.pressed || false;
        const dDown = pad.buttons[13]?.pressed || false;
        const dLeft = pad.buttons[14]?.pressed || false;
        const dRight = pad.buttons[15]?.pressed || false;

        const stickX = Math.abs(pad.axes[0]) > 0.15 ? pad.axes[0] : 0;
        const stickY = Math.abs(pad.axes[1]) > 0.15 ? -pad.axes[1] : 0;
        const cStickX = Math.abs(pad.axes[2]) > 0.15 ? pad.axes[2] : 0;
        const cStickY = Math.abs(pad.axes[3]) > 0.15 ? -pad.axes[3] : 0;

        updateInput({
          btnA: aPressed,
          btnB: bPressed,
          btnX: xPressed,
          btnY: yPressed,
          btnL: lPressed,
          btnR: rPressed,
          btnZ: zPressed,
          btnStart: startPressed,
          dpadUp: dUp,
          dpadDown: dDown,
          dpadLeft: dLeft,
          dpadRight: dRight,
          stickX,
          stickY,
          cStickX,
          cStickY,
        });
      } else {
        setConnectedGamepadName(null);
      }
      animId = requestAnimationFrame(pollGamepad);
    };

    animId = requestAnimationFrame(pollGamepad);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Accelerometer shake detection
  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0;
    let lastTime = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const cur = event.accelerationIncludingGravity;
      if (!cur || cur.x === null || cur.y === null || cur.z === null) return;
      const now = Date.now();
      if (now - lastTime > 120) {
        const diffTime = now - lastTime;
        lastTime = now;
        const speed = Math.abs(cur.x + cur.y + cur.z - lastX - lastY - lastZ) / diffTime * 10000;
        if (speed > 800) {
          triggerHaptic();
          updateInput({ shake: true });
          setTimeout(() => updateInput({ shake: false }), 200);
        }
        lastX = cur.x;
        lastY = cur.y;
        lastZ = cur.z;
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [layout.hapticFeedback]);

  // Touch analog stick handler
  const stickRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });

  const handleStickTouch = (e: React.TouchEvent | React.MouseEvent) => {
    if (isEditMode) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    if (!stickRef.current) return;
    const rect = stickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);
    const maxRadius = rect.width / 2 - 12;

    const clampedDist = Math.min(distance, maxRadius);
    const angle = Math.atan2(deltaY, deltaX);

    const normX = (Math.cos(angle) * clampedDist) / maxRadius;
    const normY = -(Math.sin(angle) * clampedDist) / maxRadius;

    setStickPos({
      x: Math.cos(angle) * clampedDist,
      y: Math.sin(angle) * clampedDist,
    });

    updateInput({ stickX: normX, stickY: normY });
  };

  const resetStick = () => {
    setStickPos({ x: 0, y: 0 });
    updateInput({ stickX: 0, stickY: 0 });
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden"
      style={{ opacity: layout.opacity }}
    >
      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-cyan-950/90 border border-cyan-400 text-cyan-200 px-4 py-2 rounded-xl text-xs flex items-center gap-3 pointer-events-auto backdrop-blur-md shadow-lg shadow-cyan-950/50">
          <Move className="w-4 h-4 text-cyan-400" />
          <span>Layout Customizer Active · Drag elements or test touches</span>
          <button
            onClick={onToggleEditMode}
            className="px-3 py-1 bg-cyan-400 text-slate-950 font-bold rounded-lg hover:bg-cyan-300 transition-colors"
          >
            Save Layout
          </button>
        </div>
      )}

      {/* Connected Physical Gamepad Indicator */}
      {connectedGamepadName && (
        <div className="absolute top-4 right-4 bg-slate-900/80 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-2 pointer-events-auto backdrop-blur-sm">
          <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="truncate max-w-[200px]">{connectedGamepadName}</span>
        </div>
      )}

      {/* --- GAMECUBE CONTROLLER OVERLAY --- */}
      {mode === 'gamecube' && (
        <div className="w-full h-full relative pointer-events-none">
          {/* Left Cluster: Analog Stick & D-Pad */}
          <div className={`absolute bottom-6 ${layout.isLeftHanded ? 'right-6' : 'left-6'} pointer-events-auto flex flex-col items-center gap-4`}>
            {/* Main Analog Stick with Octagonal Gate */}
            <div
              ref={stickRef}
              onTouchMove={handleStickTouch}
              onTouchStart={handleStickTouch}
              onTouchEnd={resetStick}
              onMouseMove={(e) => e.buttons === 1 && handleStickTouch(e)}
              onMouseUp={resetStick}
              className="w-28 h-28 rounded-full bg-slate-800/80 border-2 border-slate-600/80 p-2 flex items-center justify-center relative touch-none shadow-xl octagonal-gate"
              style={{
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8), 0 0 15px rgba(56,189,248,0.2)',
              }}
            >
              {/* Stick Cap */}
              <div
                className="w-14 h-14 rounded-full bg-gradient-to-b from-slate-400 to-slate-600 border border-slate-300/40 flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing transition-transform"
                style={{
                  transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
                }}
              >
                <div className="w-7 h-7 rounded-full border border-slate-700/40 bg-slate-500/40" />
              </div>
            </div>

            {/* D-Pad */}
            <div className="relative w-24 h-24 bg-transparent flex items-center justify-center">
              {/* Up */}
              <button
                onTouchStart={() => { triggerHaptic(); updateInput({ dpadUp: true }); }}
                onTouchEnd={() => updateInput({ dpadUp: false })}
                onMouseDown={() => { triggerHaptic(); updateInput({ dpadUp: true }); }}
                onMouseUp={() => updateInput({ dpadUp: false })}
                className="absolute top-0 w-8 h-8 bg-slate-800/90 active:bg-cyan-500 border border-slate-700 rounded-t-md text-slate-300 text-xs font-bold flex items-center justify-center"
              >
                ▲
              </button>
              {/* Down */}
              <button
                onTouchStart={() => { triggerHaptic(); updateInput({ dpadDown: true }); }}
                onTouchEnd={() => updateInput({ dpadDown: false })}
                onMouseDown={() => { triggerHaptic(); updateInput({ dpadDown: true }); }}
                onMouseUp={() => updateInput({ dpadDown: false })}
                className="absolute bottom-0 w-8 h-8 bg-slate-800/90 active:bg-cyan-500 border border-slate-700 rounded-b-md text-slate-300 text-xs font-bold flex items-center justify-center"
              >
                ▼
              </button>
              {/* Left */}
              <button
                onTouchStart={() => { triggerHaptic(); updateInput({ dpadLeft: true }); }}
                onTouchEnd={() => updateInput({ dpadLeft: false })}
                onMouseDown={() => { triggerHaptic(); updateInput({ dpadLeft: true }); }}
                onMouseUp={() => updateInput({ dpadLeft: false })}
                className="absolute left-0 w-8 h-8 bg-slate-800/90 active:bg-cyan-500 border border-slate-700 rounded-l-md text-slate-300 text-xs font-bold flex items-center justify-center"
              >
                ◀
              </button>
              {/* Right */}
              <button
                onTouchStart={() => { triggerHaptic(); updateInput({ dpadRight: true }); }}
                onTouchEnd={() => updateInput({ dpadRight: false })}
                onMouseDown={() => { triggerHaptic(); updateInput({ dpadRight: true }); }}
                onMouseUp={() => updateInput({ dpadRight: false })}
                className="absolute right-0 w-8 h-8 bg-slate-800/90 active:bg-cyan-500 border border-slate-700 rounded-r-md text-slate-300 text-xs font-bold flex items-center justify-center"
              >
                ▶
              </button>
              <div className="w-8 h-8 bg-slate-800/90" />
            </div>
          </div>

          {/* Center: Start / Pause Button */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-auto">
            <button
              onTouchStart={() => {
                triggerHaptic();
                emulatorAudio.playActionSound('pause');
                updateInput({ btnStart: true });
              }}
              onTouchEnd={() => updateInput({ btnStart: false })}
              className="px-4 py-1.5 rounded-full bg-slate-800/90 border border-red-500/60 active:bg-red-600 text-red-400 active:text-white text-[11px] font-bold tracking-widest uppercase shadow-lg backdrop-blur-sm"
            >
              Start / Pause
            </button>
          </div>

          {/* Top Shoulder Triggers: L, R, Z */}
          <div className="absolute top-4 left-6 pointer-events-auto flex gap-2">
            <button
              onTouchStart={() => { triggerHaptic(); updateInput({ btnL: 1 }); }}
              onTouchEnd={() => updateInput({ btnL: 0 })}
              className="w-16 h-10 rounded-xl bg-slate-800/80 active:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold flex items-center justify-center shadow-lg"
            >
              L (Analog)
            </button>
          </div>

          <div className="absolute top-4 right-6 pointer-events-auto flex gap-2">
            <button
              onTouchStart={() => { triggerHaptic(); updateInput({ btnZ: true }); }}
              onTouchEnd={() => updateInput({ btnZ: false })}
              className="w-12 h-10 rounded-xl bg-purple-900/80 active:bg-purple-700 border border-purple-500 text-purple-200 text-xs font-bold flex items-center justify-center shadow-lg"
            >
              Z
            </button>
            <button
              onTouchStart={() => { triggerHaptic(); updateInput({ btnR: 1 }); }}
              onTouchEnd={() => updateInput({ btnR: 0 })}
              className="w-16 h-10 rounded-xl bg-slate-800/80 active:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold flex items-center justify-center shadow-lg"
            >
              R (Analog)
            </button>
          </div>

          {/* Right Cluster: Iconic GameCube A, B, X, Y buttons & C-Stick */}
          <div className={`absolute bottom-6 ${layout.isLeftHanded ? 'left-6' : 'right-6'} pointer-events-auto flex items-end gap-6`}>
            {/* C-Stick (Yellow) */}
            <div className="flex flex-col items-center">
              <div
                onTouchStart={() => { triggerHaptic(); updateInput({ cStickX: 0.8 }); }}
                onTouchEnd={() => updateInput({ cStickX: 0 })}
                className="w-20 h-20 rounded-full bg-slate-800/80 border-2 border-yellow-600/60 flex items-center justify-center relative shadow-lg"
              >
                <div className="w-10 h-10 rounded-full bg-yellow-500 border border-yellow-300 text-slate-900 font-black text-sm flex items-center justify-center shadow-md active:scale-95 transition-transform">
                  C
                </div>
              </div>
              <span className="text-[10px] text-yellow-500/80 mt-1 font-bold">C-STICK</span>
            </div>

            {/* A, B, X, Y cluster */}
            <div className="relative w-40 h-40">
              {/* Iconic Big Green A Button in Center */}
              <button
                onTouchStart={() => { triggerHaptic(); updateInput({ btnA: true }); }}
                onTouchEnd={() => updateInput({ btnA: false })}
                onMouseDown={() => { triggerHaptic(); updateInput({ btnA: true }); }}
                onMouseUp={() => updateInput({ btnA: false })}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-emerald-500 active:bg-emerald-400 border-2 border-emerald-300 text-white font-black text-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}
              >
                A
              </button>

              {/* Red B Button to Lower-Left */}
              <button
                onTouchStart={() => { triggerHaptic(); updateInput({ btnB: true }); }}
                onTouchEnd={() => updateInput({ btnB: false })}
                onMouseDown={() => { triggerHaptic(); updateInput({ btnB: true }); }}
                onMouseUp={() => updateInput({ btnB: false })}
                className="absolute bottom-2 left-1 w-11 h-11 rounded-full bg-red-600 active:bg-red-500 border border-red-400 text-white font-black text-base flex items-center justify-center shadow-md active:scale-95 transition-transform"
              >
                B
              </button>

              {/* Grey X Button to Right */}
              <button
                onTouchStart={() => { triggerHaptic(); updateInput({ btnX: true }); }}
                onTouchEnd={() => updateInput({ btnX: false })}
                className="absolute top-1/2 -translate-y-1/2 right-0 w-8 h-14 rounded-full bg-slate-400 active:bg-slate-300 border border-slate-200 text-slate-900 font-bold text-sm flex items-center justify-center shadow-md active:scale-95 transition-transform"
              >
                X
              </button>

              {/* Grey Y Button to Top */}
              <button
                onTouchStart={() => { triggerHaptic(); updateInput({ btnY: true }); }}
                onTouchEnd={() => updateInput({ btnY: false })}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-8 rounded-full bg-slate-400 active:bg-slate-300 border border-slate-200 text-slate-900 font-bold text-sm flex items-center justify-center shadow-md active:scale-95 transition-transform"
              >
                Y
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- WII REMOTE + NUNCHUK CONTROLLER OVERLAY --- */}
      {mode === 'wiimote' && (
        <div className="w-full h-full relative pointer-events-none">
          {/* Left: Nunchuk Attachment (Stick + C + Z buttons) */}
          <div className="absolute bottom-6 left-6 pointer-events-auto flex items-end gap-3">
            {/* Nunchuk Stick */}
            <div
              ref={stickRef}
              onTouchMove={handleStickTouch}
              onTouchStart={handleStickTouch}
              onTouchEnd={resetStick}
              className="w-24 h-24 rounded-full bg-slate-800/80 border-2 border-slate-600 p-2 flex items-center justify-center relative touch-none shadow-xl"
            >
              <div
                className="w-12 h-12 rounded-full bg-slate-400 border border-slate-300 flex items-center justify-center shadow-md"
                style={{ transform: `translate(${stickPos.x}px, ${stickPos.y}px)` }}
              >
                <div className="w-5 h-5 rounded-full bg-slate-600/40" />
              </div>
            </div>

            {/* Nunchuk C and Z */}
            <div className="flex flex-col gap-2">
              <button
                onTouchStart={() => { triggerHaptic(); updateInput({ nunchukC: true }); }}
                onTouchEnd={() => updateInput({ nunchukC: false })}
                className="w-10 h-8 rounded-lg bg-slate-700/90 active:bg-slate-600 border border-slate-500 text-slate-200 text-xs font-bold"
              >
                C
              </button>
              <button
                onTouchStart={() => { triggerHaptic(); updateInput({ nunchukZ: true }); }}
                onTouchEnd={() => updateInput({ nunchukZ: false })}
                className="w-10 h-10 rounded-lg bg-slate-700/90 active:bg-slate-600 border border-slate-500 text-slate-200 text-xs font-bold"
              >
                Z
              </button>
            </div>
          </div>

          {/* Center: Shake Gesture & Recalibrate */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto flex gap-2">
            <button
              onTouchStart={() => {
                triggerHaptic();
                emulatorAudio.playActionSound('boost');
                updateInput({ shake: true });
                setTimeout(() => updateInput({ shake: false }), 200);
              }}
              className="px-4 py-2 rounded-xl bg-purple-600/90 active:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg border border-purple-400"
            >
              <Smartphone className="w-4 h-4" />
              <span>Shake Wii Remote</span>
            </button>
          </div>

          {/* Right: Wii Remote Sleek Bar */}
          <div className="absolute bottom-6 right-6 pointer-events-auto bg-slate-900/90 border border-slate-700 rounded-3xl p-3 flex flex-col items-center gap-3 shadow-2xl backdrop-blur-md">
            {/* D-Pad */}
            <div className="w-16 h-16 grid grid-cols-3 gap-1">
              <div />
              <button
                onTouchStart={() => { triggerHaptic(); updateInput({ dpadUp: true }); }}
                onTouchEnd={() => updateInput({ dpadUp: false })}
                className="bg-slate-700 active:bg-cyan-500 rounded text-[10px] text-white flex items-center justify-center font-bold"
              >
                ▲
              </button>
              <div />
              <button
                onTouchStart={() => { triggerHaptic(); updateInput({ dpadLeft: true }); }}
                onTouchEnd={() => updateInput({ dpadLeft: false })}
                className="bg-slate-700 active:bg-cyan-500 rounded text-[10px] text-white flex items-center justify-center font-bold"
              >
                ◀
              </button>
              <div className="bg-slate-800 rounded" />
              <button
                onTouchStart={() => { triggerHaptic(); updateInput({ dpadRight: true }); }}
                onTouchEnd={() => updateInput({ dpadRight: false })}
                className="bg-slate-700 active:bg-cyan-500 rounded text-[10px] text-white flex items-center justify-center font-bold"
              >
                ▶
              </button>
              <div />
              <button
                onTouchStart={() => { triggerHaptic(); updateInput({ dpadDown: true }); }}
                onTouchEnd={() => updateInput({ dpadDown: false })}
                className="bg-slate-700 active:bg-cyan-500 rounded text-[10px] text-white flex items-center justify-center font-bold"
              >
                ▼
              </button>
              <div />
            </div>

            {/* Wii Big A Button */}
            <button
              onTouchStart={() => { triggerHaptic(); updateInput({ btnA: true }); }}
              onTouchEnd={() => updateInput({ btnA: false })}
              className="w-14 h-14 rounded-full bg-cyan-500 active:bg-cyan-400 border-2 border-cyan-300 text-white font-black text-xl flex items-center justify-center shadow-lg"
            >
              A
            </button>

            {/* Underside B Trigger */}
            <button
              onTouchStart={() => { triggerHaptic(); updateInput({ btnB: true }); }}
              onTouchEnd={() => updateInput({ btnB: false })}
              className="w-14 h-9 rounded-xl bg-indigo-600 active:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center border border-indigo-400"
            >
              B (Trigger)
            </button>

            {/* -, Home, + buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onTouchStart={() => { triggerHaptic(); updateInput({ btnY: true }); }}
                onTouchEnd={() => updateInput({ btnY: false })}
                className="w-6 h-6 rounded-full bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-bold"
              >
                -
              </button>
              <button
                onTouchStart={() => { triggerHaptic(); updateInput({ btnStart: true }); }}
                onTouchEnd={() => updateInput({ btnStart: false })}
                className="w-7 h-7 rounded-full bg-blue-600 active:bg-blue-500 text-white text-[10px] font-bold"
              >
                ⌂
              </button>
              <button
                onTouchStart={() => { triggerHaptic(); updateInput({ btnX: true }); }}
                onTouchEnd={() => updateInput({ btnX: false })}
                className="w-6 h-6 rounded-full bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-bold"
              >
                +
              </button>
            </div>

            {/* 1 and 2 buttons */}
            <div className="flex gap-2">
              <button
                onTouchStart={() => { triggerHaptic(); updateInput({ btnL: 1 }); }}
                onTouchEnd={() => updateInput({ btnL: 0 })}
                className="w-7 h-7 rounded-full bg-slate-800 border border-slate-600 text-slate-300 text-xs font-bold"
              >
                1
              </button>
              <button
                onTouchStart={() => { triggerHaptic(); updateInput({ btnR: 1 }); }}
                onTouchEnd={() => updateInput({ btnR: 0 })}
                className="w-7 h-7 rounded-full bg-slate-800 border border-slate-600 text-slate-300 text-xs font-bold"
              >
                2
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
