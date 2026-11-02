import React from 'react';
import { Game, GraphicsBackend, BoosterMode } from '../types/emulator';
import { Play, Sparkles, Cpu, ShieldCheck, Zap, HardDrive, Compass, ChevronRight } from 'lucide-react';
import { emulatorAudio } from '../services/audioSynthesizer';

interface HomeViewProps {
  games: Game[];
  onLaunchGame: (game: Game) => void;
  onOpenInspect3D: (game: Game) => void;
  onNavigateTab: (tab: string) => void;
  currentBackend: GraphicsBackend;
  currentBoosterMode: BoosterMode;
  gpuName: string;
}

export const HomeView: React.FC<HomeViewProps> = ({
  games,
  onLaunchGame,
  onOpenInspect3D,
  onNavigateTab,
  currentBackend,
  currentBoosterMode,
  gpuName,
}) => {
  const featuredGame = games[0];
  const recentlyPlayed = games.filter((g) => g.lastPlayed && g.lastPlayed !== 'Never');

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Quick Launch Banner */}
      {featuredGame && (
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 shadow-2xl">
          <div className="absolute inset-0 bg-radial from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 items-center">
            {/* Left Cover Artwork Preview */}
            <div className="lg:col-span-4 flex justify-center">
              <div
                onClick={() => onOpenInspect3D(featuredGame)}
                className="relative group cursor-pointer w-48 sm:w-56 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/80 group-hover:border-cyan-400 transition-all duration-300 transform group-hover:-translate-y-1"
              >
                <img
                  src={featuredGame.coverImage}
                  alt={featuredGame.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-mono text-cyan-300 bg-slate-950/80 px-2.5 py-1 rounded-md backdrop-blur-sm border border-slate-800">
                  <span>3D CASE VIEW</span>
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                </div>
              </div>
            </div>

            {/* Right Information & Quick Action */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-semibold uppercase">
                  {featuredGame.platform} DISC
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                  60 FPS VERIFIED
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {featuredGame.gameId}</span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {featuredGame.title}
                </h1>
                <p className="text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
                  {featuredGame.notes || 'High-performance emulation running on native Dolphin core.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <div>
                  <span className="text-slate-500 block">LAST PLAYED</span>
                  <span className="text-slate-200 font-medium">{featuredGame.lastPlayed}</span>
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <span className="text-slate-500 block">PLAY TIME</span>
                  <span className="text-slate-200 font-medium">{featuredGame.playTimeMinutes} mins</span>
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <span className="text-slate-500 block">DISC FORMAT</span>
                  <span className="text-slate-200 font-medium font-mono">{featuredGame.discFormat} ({featuredGame.sizeFormatted})</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    emulatorAudio.playActionSound('boost');
                    onLaunchGame(featuredGame);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-sm rounded-xl flex items-center gap-2.5 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Resume Game</span>
                </button>

                <button
                  onClick={() => onOpenInspect3D(featuredGame)}
                  className="px-4 py-3 bg-slate-800/80 hover:bg-slate-750 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700 flex items-center gap-2 transition-colors"
                >
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>Inspect 3D Disc Case</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Telemetry & Engine Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Backend Card */}
        <div
          onClick={() => onNavigateTab('graphics')}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>GRAPHICS BACKEND</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 text-slate-500 group-hover:text-cyan-400 transition-all" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="text-lg font-bold text-white uppercase">{currentBackend}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Vulkan 1.3 pipeline with spir-v translation</p>
        </div>

        {/* GPU Driver Card */}
        <div
          onClick={() => onNavigateTab('gpu-drivers')}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>GPU DRIVER</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 text-slate-500 group-hover:text-purple-400 transition-all" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-bold text-white truncate max-w-[180px]">{gpuName.split('(')[0]}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Mesa Turnip / Adreno driver active</p>
        </div>

        {/* Game Booster Card */}
        <div
          onClick={() => onNavigateTab('booster')}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>BOOSTER PROFILE</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 text-slate-500 group-hover:text-amber-400 transition-all" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="text-lg font-bold text-white uppercase">{currentBoosterMode}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">CPU PowerPC JIT: 100% (729 MHz)</p>
        </div>

        {/* Emulation Core Card */}
        <div
          onClick={() => onNavigateTab('settings')}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>CORE STATUS</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 text-slate-500 group-hover:text-emerald-400 transition-all" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-lg font-bold text-white">Dolphin 5.0+</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Dual Core JIT + Fastmem active</p>
        </div>
      </div>

      {/* Recently Played Games Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Recently Played</h2>
            <p className="text-xs text-slate-400">Resume your games with instant save state restoration</p>
          </div>
          <button
            onClick={() => onNavigateTab('library')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <span>View All ({games.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {recentlyPlayed.map((game) => (
            <div
              key={game.id}
              className="group relative rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/60 transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div
                onClick={() => onOpenInspect3D(game)}
                className="relative aspect-[3/4] overflow-hidden cursor-pointer bg-slate-950"
              >
                <img
                  src={game.coverImage}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    game.platform === 'wii' ? 'bg-cyan-500 text-slate-950' : 'bg-purple-600 text-white'
                  }`}>
                    {game.platform}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-slate-300 border border-slate-800">
                    {game.discFormat}
                  </span>
                </div>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {game.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                    <span>{game.gameId}</span>
                    <span>·</span>
                    <span>{game.region}</span>
                  </div>
                </div>

                <button
                  onClick={() => onLaunchGame(game)}
                  className="w-full py-2 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
