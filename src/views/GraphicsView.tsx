import React, { useState } from 'react';
import { GraphicsSettings, InternalResolution, GraphicsBackend, AntiAliasing, TextureFiltering, WidescreenMode, ShaderCompilation, PostProcessing } from '../types/emulator';
import { emulatorAudio } from '../services/audioSynthesizer';
import {
  Monitor,
  Sparkles,
  Layers,
  Cpu,
  Trash2,
  CheckCircle2,
  Sliders,
  Eye,
  Info,
} from 'lucide-react';

interface GraphicsViewProps {
  settings: GraphicsSettings;
  onUpdate: (updated: Partial<GraphicsSettings>) => void;
  detectedGpu: string;
}

export const GraphicsView: React.FC<GraphicsViewProps> = ({
  settings,
  onUpdate,
  detectedGpu,
}) => {
  const [cachePurgedToast, setCachePurgedToast] = useState(false);
  const [compiledShadersCount, setCompiledShadersCount] = useState(3842);

  const handlePurgeCache = () => {
    emulatorAudio.playActionSound('hit');
    setCompiledShadersCount(0);
    setCachePurgedToast(true);
    setTimeout(() => setCachePurgedToast(false), 2500);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">HD Graphics & Rendering Engine</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure internal resolution multipliers, Vulkan/OpenGL backends, texture filters, and Ubershaders.
          </p>
        </div>

        {/* Auto Optimize Toggle */}
        <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <div className="text-right">
            <span className="text-xs font-semibold text-white block">Auto-Select Best Backend</span>
            <span className="text-[10px] text-cyan-400 font-mono">Matched to {detectedGpu.split(' ')[0]}</span>
          </div>
          <button
            onClick={() => onUpdate({ autoOptimize: !settings.autoOptimize })}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              settings.autoOptimize ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.autoOptimize ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {cachePurgedToast && (
        <div className="p-3 bg-cyan-950 border border-cyan-500 text-cyan-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>Shader cache purged. Pipelines will recompile asynchronously with zero freeze.</span>
        </div>
      )}

      {/* Grid of Graphics Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Resolution & Backend */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Monitor className="w-4 h-4 text-cyan-400" />
            <span>Resolution & Graphics Backend</span>
          </h2>

          {/* Graphics Backend Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Graphics API Backend</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdate({ backend: 'vulkan' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.backend === 'vulkan'
                    ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-lg shadow-cyan-950/50'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Vulkan 1.3 (Recommended)</span>
                  <span className="text-[10px] text-cyan-400 font-mono">FASTEST</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Low overhead, multithreaded command buffers. Best on Qualcomm Adreno & Mali.
                </p>
              </button>

              <button
                onClick={() => onUpdate({ backend: 'opengles' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.backend === 'opengles'
                    ? 'bg-purple-950/80 border-purple-400 text-white shadow-lg shadow-purple-950/50'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">OpenGL ES 3.2</span>
                  <span className="text-[10px] text-purple-400 font-mono">LEGACY</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Maximum compatibility for older chipsets and specific games like Wind Waker.
                </p>
              </button>
            </div>
          </div>

          {/* Internal Resolution Scale */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Internal Resolution Upscaling</span>
              <span className="text-cyan-400 font-bold font-mono">
                {settings.internalResolution === '1x' && '480p Native (640x528)'}
                {settings.internalResolution === '1.5x' && '720p HD (960x792)'}
                {settings.internalResolution === '2x' && '1080p FHD (1280x1056)'}
                {settings.internalResolution === '3x' && '1440p 2K (1920x1584)'}
                {settings.internalResolution === '4x' && '2160p 4K UHD (2560x2112)'}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {(['1x', '1.5x', '2x', '3x', '4x'] as InternalResolution[]).map((res) => (
                <button
                  key={res}
                  onClick={() => onUpdate({ internalResolution: res })}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    settings.internalResolution === res
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>2x (1080p) is recommended for flagship Snapdragon 8-series and Dimensity 9000.</span>
            </p>
          </div>

          {/* Widescreen & Aspect Ratio */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Aspect Ratio & Widescreen</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'auto', label: 'Auto (Game)' },
                { id: '16_9', label: 'Force 16:9' },
                { id: '4_3', label: 'Standard 4:3' },
                { id: 'widescreen_hack', label: '16:9 Hack' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => onUpdate({ widescreenMode: item.id as WidescreenMode })}
                  className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                    settings.widescreenMode === item.id
                      ? 'bg-cyan-950 border border-cyan-400 text-cyan-200'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 2: Filters, Shaders & Pipeline */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Anti-Aliasing & Texture Filtering</span>
          </h2>

          {/* Anti-Aliasing */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Anti-Aliasing (Smoothing)</label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { id: 'none', label: 'None' },
                { id: 'fxaa', label: 'FXAA' },
                { id: 'msaa2x', label: '2x MSAA' },
                { id: 'msaa4x', label: '4x MSAA' },
                { id: 'msaa8x', label: '8x MSAA' },
              ].map((aa) => (
                <button
                  key={aa.id}
                  onClick={() => onUpdate({ antiAliasing: aa.id as AntiAliasing })}
                  className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                    settings.antiAliasing === aa.id
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {aa.label}
                </button>
              ))}
            </div>
          </div>

          {/* Anisotropic Filtering */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Anisotropic Texture Filtering</label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { id: 'bilinear', label: 'Default' },
                { id: 'anisotropic2x', label: '2x' },
                { id: 'anisotropic4x', label: '4x' },
                { id: 'anisotropic8x', label: '8x' },
                { id: 'anisotropic16x', label: '16x' },
              ].map((af) => (
                <button
                  key={af.id}
                  onClick={() => onUpdate({ textureFiltering: af.id as TextureFiltering })}
                  className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                    settings.textureFiltering === af.id
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {af.label}
                </button>
              ))}
            </div>
          </div>

          {/* Shader Compilation Mode */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Shader Compilation Strategy</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onUpdate({ shaderCompilation: 'async_ubershaders' })}
                className={`p-2.5 rounded-xl border text-left transition-colors ${
                  settings.shaderCompilation === 'async_ubershaders'
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="font-bold block">Hybrid Ubershaders</span>
                <span className="text-[11px] text-slate-400">Zero stutter. Prepares generic fallback while compiling.</span>
              </button>

              <button
                onClick={() => onUpdate({ shaderCompilation: 'async_skip' })}
                className={`p-2.5 rounded-xl border text-left transition-colors ${
                  settings.shaderCompilation === 'async_skip'
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="font-bold block">Async (Skip Drawing)</span>
                <span className="text-[11px] text-slate-400">Fastest framerate. Objects pop in once shader is ready.</span>
              </button>
            </div>
          </div>

          {/* Shader Cache Stats & Purge */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Disk Shader Cache</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {compiledShadersCount} Pipelines Compiled · 18.4 MB on disk
              </span>
            </div>
            <button
              onClick={handlePurgeCache}
              className="px-3 py-1.5 bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Cache</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
