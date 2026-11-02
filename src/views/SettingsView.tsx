import React, { useState } from 'react';
import { MemoryCardFile } from '../types/emulator';
import { MemoryCardService } from '../services/memoryCardService';
import { emulatorAudio } from '../services/audioSynthesizer';
import {
  Settings,
  HardDrive,
  ShieldCheck,
  Download,
  Trash2,
  FileCode,
  Smartphone,
  ExternalLink,
  Code2,
  CheckCircle2,
} from 'lucide-react';

interface SettingsViewProps {
  memcardFiles: MemoryCardFile[];
  onRefreshMemcard: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  memcardFiles,
  onRefreshMemcard,
}) => {
  const [activeTab, setActiveTab] = useState<'memcard' | 'android_arch' | 'license'>('memcard');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteSave = (id: string) => {
    emulatorAudio.playActionSound('hit');
    MemoryCardService.deleteFile(id);
    onRefreshMemcard();
    showToast('Save record deleted from Memory Card Slot A');
  };

  const handleExportSave = (file: MemoryCardFile) => {
    emulatorAudio.playActionSound('score');
    MemoryCardService.exportGciSave(file);
    showToast(`Exported ${file.fileName} (.gci format)!`);
  };

  // Calculate memory card blocks
  const usedBlocks = memcardFiles.reduce((acc, f) => acc + f.blocks, 0);
  const totalBlocks = 2043; // Standard GameCube 16MB Card
  const freeBlocks = totalBlocks - usedBlocks;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Core Settings & System Storage</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage Memory Cards, inspect Dolphin core configurations, and explore Android 13 Kotlin architecture.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('memcard')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'memcard'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Memory Card (Slot A)
          </button>
          <button
            onClick={() => setActiveTab('android_arch')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'android_arch'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Android Architecture (Kotlin)
          </button>
          <button
            onClick={() => setActiveTab('license')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'license'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            GPL v2+ & Dolphin Core
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-3 bg-cyan-950 border border-cyan-500 text-cyan-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* TAB 1: MEMORY CARD MANAGER */}
      {activeTab === 'memcard' && (
        <div className="space-y-6">
          {/* Card Capacity Indicator */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-5 h-5 text-cyan-400" />
                <div>
                  <h2 className="text-sm font-bold text-white">GameCube Memory Card (Slot A - 2043 Blocks)</h2>
                  <span className="text-[11px] text-slate-400">Standard 16MB Raw Image (MemoryCardA.USA.raw)</span>
                </div>
              </div>
              <div className="text-right text-xs font-mono">
                <span className="text-cyan-400 font-bold">{freeBlocks}</span>
                <span className="text-slate-500"> / {totalBlocks} Blocks Free</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                style={{ width: `${(usedBlocks / totalBlocks) * 100}%` }}
              />
            </div>
          </div>

          {/* Saves List */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Stored In-Game Saves (.gci files)</h3>

            <div className="grid grid-cols-1 gap-2.5">
              {memcardFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{file.gameTitle}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 text-[10px] font-mono text-cyan-400 border border-slate-800">
                        {file.gameId}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{file.blocks} Blocks</span>
                    </div>
                    <p className="text-[11px] text-slate-300">{file.comments}</p>
                    <span className="text-[10px] text-slate-500 font-mono">Saved: {file.savedAt}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExportSave(file)}
                      title="Export .gci raw save file"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteSave(file.id)}
                      title="Delete save file from memory card"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-400 border border-slate-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANDROID 13 / COLOROS 13 ARCHITECTURE */}
      {activeTab === 'android_arch' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <span>Android 13 / ColorOS 13 Native Architecture</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Modern modular Kotlin & C++ Android project structure designed for high-performance Dolphin JNI execution.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              Target: Android 13 (API 33)
            </span>
          </div>

          {/* Architecture Tree */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 space-y-1.5 overflow-x-auto">
            <div className="text-cyan-400 font-bold">UltraWiiEmulator/</div>
            <div className="pl-4">├── app/ <span className="text-slate-500">// Jetpack Compose UI Entry & Navigation</span></div>
            <div className="pl-4">├── core-emulator/ <span className="text-slate-500">// PowerPC 750CL & Gekko CPU JIT Bridge</span></div>
            <div className="pl-4">├── core-graphics/ <span className="text-slate-500">// Vulkan 1.3 & OpenGL ES 3.2 Renderer</span></div>
            <div className="pl-4">├── driver-manager/ <span className="text-slate-500">// Turnip Mesa & Qualcomm Adreno Loader</span></div>
            <div className="pl-4">├── feature-controller/ <span className="text-slate-500">// Touch Overlays, MotionPlus & Gamepad API</span></div>
            <div className="pl-4">├── feature-boost/ <span className="text-slate-500">// ColorOS Thermal Governor & PPC Frequency Scaler</span></div>
            <div className="pl-4">└── cpp/ <span className="text-slate-500">// Dolphin Core Native C++ Engine (libdolphin.so)</span></div>
            <div className="pl-8">├── Source/Core/VideoBackends/Vulkan/</div>
            <div className="pl-8">├── Source/Core/Core/HW/Wiimote.cpp</div>
            <div className="pl-8">└── CMakeLists.txt</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="font-bold text-white block">JNI Native Binding</span>
              <p className="text-slate-400 leading-relaxed">
                Java Native Interface bindings expose zero-copy frame buffers directly to Android SurfaceView via Vulkan Swapchain (VK_KHR_android_surface).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="font-bold text-white block">ColorOS 13 Performance Mode</span>
              <p className="text-slate-400 leading-relaxed">
                Integrates with Android PerformanceHintManager API to notify ColorOS scheduler of frame deadlines and sustain locked 60 FPS without stutter.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GPL LICENSE & DOLPHIN CORE ATTRIBUTION */}
      {activeTab === 'license' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">GNU General Public License (GPL v2+) Compliance</h2>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Ultra Wii Emulator incorporates and complies with the open-source Dolphin Emulator project. Dolphin is licensed under the GNU General Public License, version 2 or later (GPL-2.0-or-later).
          </p>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 space-y-2 leading-relaxed">
            <div className="text-slate-200 font-bold">Dolphin Emulator Core Notice:</div>
            <div>Copyright (c) 2003-2026 Dolphin Team & Contributors.</div>
            <div>
              This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 2 of the License, or (at your option) any later version.
            </div>
            <div>
              This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <a
              href="https://github.com/dolphin-emu/dolphin"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-cyan-300 font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <span>Dolphin Upstream Repository</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
