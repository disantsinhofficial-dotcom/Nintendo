import React, { useState, useRef } from 'react';
import { GpuDriver, GraphicsBackend } from '../types/emulator';
import { DetectedGpuInfo } from '../services/gpuDetector';
import { emulatorAudio } from '../services/audioSynthesizer';
import {
  Cpu,
  Layers,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Zap,
  Info,
  ExternalLink,
} from 'lucide-react';

interface GpuDriversViewProps {
  detectedInfo: DetectedGpuInfo;
  drivers: GpuDriver[];
  activeDriverId: string;
  onSelectDriver: (driverId: string) => void;
  onInstallCustomDriver: (driver: GpuDriver) => void;
  currentBackend: GraphicsBackend;
}

export const GpuDriversView: React.FC<GpuDriversViewProps> = ({
  detectedInfo,
  drivers,
  activeDriverId,
  onSelectDriver,
  onInstallCustomDriver,
  currentBackend,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCustomDriverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsImporting(true);
    setTimeout(() => {
      const customDriver: GpuDriver = {
        id: `drv_custom_${Date.now()}`,
        name: file.name.replace('.zip', ''),
        version: 'Custom User Package (Turnip/Vulkan)',
        vendor: 'User Imported',
        type: 'custom',
        vulkanApiVersion: '1.3.284',
        openglVersion: 'OpenGL ES 3.2',
        stability: 'Experimental',
        recommended: false,
        description: `Imported from archive "${file.name}". User-space driver loaded into Dolphin container.`,
        packageSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      };
      onInstallCustomDriver(customDriver);
      setIsImporting(false);
      showToast(`Installed custom driver: ${customDriver.name}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 1200);
  };

  const handleBackupDrivers = () => {
    const backupJson = JSON.stringify({ activeDriverId, date: new Date().toISOString(), drivers }, null, 2);
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ultra_wii_gpu_driver_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('GPU Driver profile configuration backed up!');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">GPU Driver Manager</h1>
          <p className="text-xs text-slate-400 mt-1">
            Detects GPU hardware and manages Android user-space Vulkan drivers (Mesa Turnip & Qualcomm Adreno).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCustomDriverUpload}
            accept=".zip"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Import Custom Driver (.zip)</span>
          </button>
          <button
            onClick={handleBackupDrivers}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Backup</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-cyan-950 border border-cyan-500 text-cyan-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Detected Hardware Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* GPU Chipset */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 block font-semibold">DETECTED GPU HARDWARE</span>
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-white text-base truncate">{detectedInfo.renderer}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono space-y-0.5">
            <div>Vendor: {detectedInfo.vendor}</div>
            <div>Architecture: {detectedInfo.deviceArchitecture}</div>
          </div>
        </div>

        {/* Graphics APIs */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 block font-semibold">SUPPORTED GRAPHICS APIS</span>
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-white text-base">Vulkan 1.3 + GLES 3.2</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono space-y-0.5">
            <div>Vulkan: {detectedInfo.vulkanVersion}</div>
            <div>Max Anisotropy: {detectedInfo.maxAnisotropy}x</div>
          </div>
        </div>

        {/* Selected Backend Status */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 block font-semibold">ACTIVE BACKEND</span>
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-white text-base uppercase">{currentBackend}</span>
          </div>
          <p className="text-[11px] text-emerald-400">
            Hardware acceleration active · Zero root required
          </p>
        </div>
      </div>

      {/* Android Security Notice Box */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-200 block">Android User-Space Driver Architecture</span>
          <p className="leading-relaxed">
            Ultra Wii Emulator loads custom Vulkan ICD (Installable Client Driver) packages directly into the application process sandbox via standard Android dlopen/vulkan-layer APIs. No root access or system partition modification is required or permitted.
          </p>
        </div>
      </div>

      {/* Available Drivers List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Installed & Compatible GPU Drivers</h2>

        <div className="grid grid-cols-1 gap-3">
          {drivers.map((drv) => {
            const isActive = activeDriverId === drv.id;
            return (
              <div
                key={drv.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isActive
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-xl shadow-cyan-950/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{drv.name}</span>
                    {drv.recommended && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500 text-slate-950 font-bold uppercase">
                        Recommended
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        drv.stability === 'High'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {drv.stability} Stability
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 max-w-2xl">{drv.description}</p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                    <span>Version: {drv.version}</span>
                    <span>·</span>
                    <span>API: {drv.vulkanApiVersion}</span>
                    <span>·</span>
                    <span>Vendor: {drv.vendor}</span>
                    <span>·</span>
                    <span>Package: {drv.packageSize}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isActive ? (
                    <div className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Active Driver</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        emulatorAudio.playButtonSound();
                        onSelectDriver(drv.id);
                        showToast(`Switched driver to: ${drv.name}`);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-600 transition-colors"
                    >
                      Switch to This Driver
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
