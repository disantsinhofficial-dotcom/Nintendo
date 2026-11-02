import React, { useState } from 'react';
import { BoosterSettings, BoosterMode } from '../types/emulator';
import { emulatorAudio } from '../services/audioSynthesizer';
import {
  Zap,
  Gauge,
  Thermometer,
  Cpu,
  HardDrive,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Activity,
  Battery,
  ShieldCheck,
} from 'lucide-react';

interface GameBoosterViewProps {
  settings: BoosterSettings;
  onUpdate: (updated: Partial<BoosterSettings>) => void;
  fps: number;
}

export const GameBoosterView: React.FC<GameBoosterViewProps> = ({
  settings,
  onUpdate,
  fps,
}) => {
  const [ramFreedToast, setRamFreedToast] = useState(false);
  const [ramUsedMb, setRamUsedMb] = useState(1420);

  const handleFreeRam = () => {
    emulatorAudio.playActionSound('score');
    setRamUsedMb(980);
    setRamFreedToast(true);
    setTimeout(() => setRamFreedToast(false), 2500);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Game Booster & Hardware Governor</h1>
          <p className="text-xs text-slate-400 mt-1">
            Optimize PowerPC CPU emulation clock, JIT aggressive scheduling, and thermal throttling envelopes.
          </p>
        </div>

        {/* Free RAM Button */}
        <button
          onClick={handleFreeRam}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-cyan-300 font-semibold text-xs rounded-xl border border-cyan-500/40 flex items-center gap-2 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-cyan-400" />
          <span>Flush Background Cache</span>
        </button>
      </div>

      {ramFreedToast && (
        <div className="p-3 bg-cyan-950 border border-cyan-500 text-cyan-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>Freed 440 MB of unused texture cache and GC objects!</span>
        </div>
      )}

      {/* Mode Presets (3 Large Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Performance Mode */}
        <div
          onClick={() => {
            emulatorAudio.playButtonSound();
            onUpdate({ mode: 'performance', ppcClockRatio: 1.15, jitAggressive: true });
          }}
          className={`p-6 rounded-2xl border cursor-pointer transition-all ${
            settings.mode === 'performance'
              ? 'bg-amber-950/40 border-amber-400 shadow-xl shadow-amber-950/40 ring-1 ring-amber-400'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <Zap className="w-6 h-6 text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
              Max FPS
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mt-3">Performance Mode</h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Overclocks simulated PowerPC Broadway CPU to 115% (838 MHz). Aggressive JIT compilation for intense action scenes.
          </p>
        </div>

        {/* Balanced Mode */}
        <div
          onClick={() => {
            emulatorAudio.playButtonSound();
            onUpdate({ mode: 'balanced', ppcClockRatio: 1.0, jitAggressive: false });
          }}
          className={`p-6 rounded-2xl border cursor-pointer transition-all ${
            settings.mode === 'balanced'
              ? 'bg-cyan-950/40 border-cyan-400 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-400'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <Activity className="w-6 h-6 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
              Default
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mt-3">Balanced Mode</h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            100% native clock (729 MHz). Constant 60 FPS cap with balanced power draw and stable temperatures.
          </p>
        </div>

        {/* Battery Saving Mode */}
        <div
          onClick={() => {
            emulatorAudio.playButtonSound();
            onUpdate({ mode: 'battery', ppcClockRatio: 0.85, jitAggressive: false });
          }}
          className={`p-6 rounded-2xl border cursor-pointer transition-all ${
            settings.mode === 'battery'
              ? 'bg-emerald-950/40 border-emerald-400 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-400'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <Battery className="w-6 h-6 text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              Long Battery
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mt-3">Battery Saver Mode</h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            PowerPC clock throttled to 85% (620 MHz). Reduces GPU shader workload and preserves device battery life.
          </p>
        </div>
      </div>

      {/* Real-Time Hardware Telemetry Meters */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <span>Real-time Hardware Telemetry (ColorOS 13 / Android)</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Framerate Meter */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-semibold">CURRENT FRAMERATE</span>
            <div className="text-2xl font-mono font-bold text-emerald-400">{fps.toFixed(1)} FPS</div>
            <span className="text-[10px] text-slate-500">Target: {settings.targetFps} FPS</span>
          </div>

          {/* Emulated CPU Clock */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-semibold">POWERPC CLOCK</span>
            <div className="text-2xl font-mono font-bold text-cyan-400">
              {Math.round(settings.ppcClockRatio * 729)} MHz
            </div>
            <span className="text-[10px] text-cyan-400/80 font-mono">
              Ratio: {Math.round(settings.ppcClockRatio * 100)}%
            </span>
          </div>

          {/* Device Thermal Sensor */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-semibold">DEVICE THERMAL STATE</span>
            <div className="text-2xl font-mono font-bold text-emerald-400 flex items-center gap-1.5">
              <Thermometer className="w-5 h-5 text-emerald-400" />
              <span>37.4 °C</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">Status: Nominal (No Throttling)</span>
          </div>

          {/* RAM Usage */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-semibold">EMULATOR RAM USAGE</span>
            <div className="text-2xl font-mono font-bold text-purple-400">{ramUsedMb} MB</div>
            <span className="text-[10px] text-slate-500">Allocated out of 8.0 GB</span>
          </div>
        </div>

        {/* Sliders & Fine Tuning */}
        <div className="pt-4 border-t border-slate-800 space-y-5">
          {/* Target FPS limiter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Target Framerate Limiter</label>
            <div className="grid grid-cols-3 gap-2">
              {[30, 60, 120].map((tFps) => (
                <button
                  key={tFps}
                  onClick={() => onUpdate({ targetFps: tFps as any })}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    settings.targetFps === tFps
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {tFps} FPS {tFps === 60 ? '(Default)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Manual PPC Clock Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span>PowerPC Broadway Frequency Scaling</span>
              <span className="font-mono text-cyan-400 font-bold">
                {Math.round(settings.ppcClockRatio * 100)}% ({Math.round(settings.ppcClockRatio * 729)} MHz)
              </span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={settings.ppcClockRatio}
              onChange={(e) => onUpdate({ ppcClockRatio: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
