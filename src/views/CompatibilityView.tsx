import React, { useState } from 'react';
import { COMPATIBILITY_DATABASE } from '../data/compatibilityData';
import { CompatibilityRating, Platform } from '../types/emulator';
import { Search, Filter, ShieldCheck, CheckCircle2, AlertCircle, Cpu } from 'lucide-react';

export const CompatibilityView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'wii' | 'gamecube'>('all');

  const filtered = COMPATIBILITY_DATABASE.filter((item) => {
    if (platformFilter !== 'all' && item.platform !== platformFilter) return false;
    if (
      search &&
      !item.title.toLowerCase().includes(search.toLowerCase()) &&
      !item.id.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Game Compatibility Database</h1>
          <p className="text-xs text-slate-400 mt-1">
            Verified testing reports, recommended Vulkan/OpenGL backends, and optimal settings for 500+ titles.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => setPlatformFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                platformFilter === 'all' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setPlatformFilter('wii')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                platformFilter === 'wii' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              Wii
            </button>
            <button
              onClick={() => setPlatformFilter('gamecube')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                platformFilter === 'gamecube' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              GameCube
            </button>
          </div>
        </div>
      </div>

      {/* Compatibility Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Game Title & Disc ID</th>
                <th className="py-3.5 px-4">Platform</th>
                <th className="py-3.5 px-4">Compatibility Status</th>
                <th className="py-3.5 px-4">Recommended Backend</th>
                <th className="py-3.5 px-4">Tested Hardware</th>
                <th className="py-3.5 px-4">Configuration Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-white text-sm block">{item.title}</span>
                    <span className="text-[11px] font-mono text-cyan-400">{item.id}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.platform === 'wii' ? 'bg-cyan-500 text-slate-950' : 'bg-purple-600 text-white'
                      }`}
                    >
                      {item.platform}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 ${
                        item.rating === 'Perfect'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-blue-950 text-blue-300 border border-blue-500/40'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{item.rating}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-200">
                    {item.recommendedBackend}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {item.testedGpu}
                  </td>
                  <td className="py-3 px-4 text-slate-300 text-[11px] max-w-xs">
                    {item.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
