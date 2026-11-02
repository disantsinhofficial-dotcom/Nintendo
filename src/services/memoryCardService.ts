import { MemoryCardFile, SaveState } from '../types/emulator';

const STORAGE_KEY_MEMCARD = 'ultra_wii_memcard_files';
const STORAGE_KEY_SAVESTATES = 'ultra_wii_savestates';

export const INITIAL_MEMCARD_FILES: MemoryCardFile[] = [
  {
    id: 'save_1',
    gameId: 'RMCE01',
    gameTitle: 'Cosmic Drift Racers',
    fileName: 'cosmic_drift.gci',
    blocks: 12,
    savedAt: '2026-11-01 19:42',
    comments: 'All 32 Grand Prix Cups Gold Star 3★',
  },
  {
    id: 'save_2',
    gameId: 'GZ2E01',
    gameTitle: "Mythic Blade: Shadow's Awakening",
    fileName: 'mythic_blade_slot1.gci',
    blocks: 27,
    savedAt: '2026-10-28 22:15',
    comments: 'Temple of Time - Master Sword retrieved, 18 Heart Pieces',
  },
  {
    id: 'save_3',
    gameId: 'GALE01',
    gameTitle: 'Ultimate Strike Force: Stadium Brawl',
    fileName: 'sf_stadium_records.gci',
    blocks: 15,
    savedAt: '2026-10-25 14:02',
    comments: 'All secret fighters unlocked, Trophy count: 290',
  },
];

export class MemoryCardService {
  public static getFiles(): MemoryCardFile[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MEMCARD);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed reading memcard storage:', e);
    }
    return INITIAL_MEMCARD_FILES;
  }

  public static saveFiles(files: MemoryCardFile[]) {
    try {
      localStorage.setItem(STORAGE_KEY_MEMCARD, JSON.stringify(files));
    } catch (e) {
      console.warn('Failed saving memcard storage:', e);
    }
  }

  public static addFile(file: Omit<MemoryCardFile, 'id'>): MemoryCardFile {
    const files = this.getFiles();
    const newFile: MemoryCardFile = {
      ...file,
      id: `mc_${Date.now()}`,
    };
    files.unshift(newFile);
    this.saveFiles(files);
    return newFile;
  }

  public static deleteFile(id: string) {
    const files = this.getFiles().filter((f) => f.id !== id);
    this.saveFiles(files);
    return files;
  }

  public static getSaveStates(gameId: string): SaveState[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_SAVESTATES}_${gameId}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed reading save states:', e);
    }
    return [];
  }

  public static saveState(state: SaveState) {
    const list = this.getSaveStates(state.gameId).filter((s) => s.slot !== state.slot);
    list.push(state);
    list.sort((a, b) => a.slot - b.slot);
    try {
      localStorage.setItem(`${STORAGE_KEY_SAVESTATES}_${state.gameId}`, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed writing save state:', e);
    }
    return list;
  }

  public static deleteSaveState(gameId: string, slot: number) {
    const list = this.getSaveStates(gameId).filter((s) => s.slot !== slot);
    try {
      localStorage.setItem(`${STORAGE_KEY_SAVESTATES}_${gameId}`, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed deleting save state:', e);
    }
    return list;
  }

  public static exportGciSave(file: MemoryCardFile) {
    const content = `GCI-GAMECUBE-SAVE-MAGIC\nGame: ${file.gameTitle}\nGameID: ${file.gameId}\nBlocks: ${file.blocks}\nTimestamp: ${file.savedAt}\nChecksum: 0x8FA43D9B\n`;
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}
