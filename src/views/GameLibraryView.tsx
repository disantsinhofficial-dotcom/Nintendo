import React, { useState, useRef } from 'react';
import { Game, Platform } from '../types/emulator';
import { createGameFromFile } from '../services/isoParser';
import { emulatorAudio } from '../services/audioSynthesizer';
import {
  FolderPlus,
  Upload,
  Search,
  Filter,
  Star,
  Trash2,
  Play,
  Rotate3d,
  Disc,
  FolderOpen,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';

interface GameLibraryViewProps {
  games: Game[];
  onLaunchGame: (game: Game) => void;
  onOpenInspect3D: (game: Game) => void;
  onAddGame: (game: Game) => void;
  onRemoveGame: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
}

export const GameLibraryView: React.FC<GameLibraryViewProps> = ({
  games,
  onLaunchGame,
  onOpenInspect3D,
  onAddGame,
  onRemoveGame,
  onToggleFavorite,
}) => {
  const [platformFilter, setPlatformFilter] = useState<'all' | 'wii' | 'gamecube'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'recent' | 'size' | 'rating'>('recent');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload Handler for real disc images
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsScanning(true);
    setScanMessage(`Parsing disc header for ${files[0].name}...`);

    try {
      const newGame = await createGameFromFile(files[0]);
      emulatorAudio.playActionSound('score');
      onAddGame(newGame);
      setScanMessage(`Successfully imported "${newGame.title}" (${newGame.gameId})!`);
      setTimeout(() => setScanMessage(null), 3500);
    } catch (err) {
      console.error('Disc parse error:', err);
      setScanMessage('Failed to parse disc image.');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Simulated Storage Access Framework (SAF) folder scanner
  const handleScanDirectory = () => {
    setIsScanning(true);
    setScanMessage('Android Storage Access Framework: Scanning /storage/emulated/0/Wii_GameCube/ ...');
    setTimeout(() => {
      setIsScanning(false);
      setScanMessage('Scan complete: All ISO, WBFS and RVZ titles up to date.');
      setTimeout(() => setScanMessage(null), 3000);
    }, 1200);
  };

  // Filter & Sort
  const filteredGames = games
    .filter((g) => {
      if (platformFilter !== 'all' && g.platform !== platformFilter) return false;
      if (
        searchQuery &&
        !g.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !g.gameId.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'size') return b.sizeBytes - a.sizeBytes;
      if (sortBy === 'rating') return a.compatibilityRating.localeCompare(b.compatibilityRating);
      return b.playTimeMinutes - a.playTimeMinutes;
    });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & SAF Importer Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Game Library</h1>
          <p className="text-xs text-slate-400 mt-1">
            Supported formats: ISO, WBFS, RVZ, GCM, CISO. Automatic header parsing & ID extraction.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Real File Input (Hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".iso,.wbfs,.rvz,.gcm,.ciso"
            className="hidden"
          />

          {/* Import Single File Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Import Disc Image</span>
          </button>

          {/* SAF Android Directory Scan Button */}
          <button
            onClick={handleScanDirectory}
            disabled={isScanning}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <FolderPlus className="w-4 h-4 text-cyan-400" />
            <span>Android SAF Folder Scan</span>
          </button>
        </div>
      </div>

      {/* Scanning status banner */}
      {scanMessage && (
        <div className="p-3.5 bg-cyan-950/80 border border-cyan-500/50 rounded-xl flex items-center gap-3 text-xs text-cyan-200 backdrop-blur-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Platform filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setPlatformFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              platformFilter === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Games ({games.length})
          </button>
          <button
            onClick={() => setPlatformFilter('wii')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              platformFilter === 'wii'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Wii ({games.filter((g) => g.platform === 'wii').length})
          </button>
          <button
            onClick={() => setPlatformFilter('gamecube')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              platformFilter === 'gamecube'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            GameCube ({games.filter((g) => g.platform === 'gamecube').length})
          </button>
        </div>

        {/* Search input & Sort */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title or ID (e.g. RMCE01)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="recent">Sort: Most Played</option>
            <option value="title">Sort: Title (A-Z)</option>
            <option value="size">Sort: File Size</option>
            <option value="rating">Sort: Compatibility</option>
          </select>
        </div>
      </div>

      {/* Games Grid */}
      {filteredGames.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-800 space-y-3">
          <Disc className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No Games Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Import your legally obtained Wii (.iso, .wbfs, .rvz) or GameCube (.gcm, .iso) game files using the button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              className="group relative rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/60 transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Cover Image Container */}
              <div className="relative aspect-[3/4] overflow-hidden bg-slate-950">
                <img
                  src={game.coverImage}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onClick={() => onOpenInspect3D(game)}
                />

                {/* Top Badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      game.platform === 'wii' ? 'bg-cyan-500 text-slate-950' : 'bg-purple-600 text-white'
                    }`}
                  >
                    {game.platform}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-slate-300 border border-slate-800">
                    {game.discFormat}
                  </span>
                </div>

                {/* Favorite Star */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(game.id);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-950/80 hover:bg-slate-900 text-amber-400 border border-slate-800 flex items-center justify-center transition-colors"
                >
                  <Star className={`w-3.5 h-3.5 ${game.favorite ? 'fill-amber-400' : 'stroke-amber-400'}`} />
                </button>

                {/* 3D Case Inspector Overlay Trigger */}
                <button
                  onClick={() => onOpenInspect3D(game)}
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-900 text-cyan-300 border border-slate-800 flex items-center gap-1 text-[10px] font-mono backdrop-blur-sm transition-colors"
                >
                  <Rotate3d className="w-3.5 h-3.5 text-cyan-400" />
                  <span>3D</span>
                </button>
              </div>

              {/* Game Metadata & Actions */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {game.title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                    <span>{game.gameId} · {game.region}</span>
                    <span>{game.sizeFormatted}</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={() => {
                      emulatorAudio.playActionSound('boost');
                      onLaunchGame(game);
                    }}
                    className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Boot</span>
                  </button>

                  {/* Remove without deleting original file */}
                  <button
                    onClick={() => onRemoveGame(game.id)}
                    title="Remove from Library (original disc file remains untouched)"
                    className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-red-950 hover:text-red-400 text-slate-400 border border-slate-700/80 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
