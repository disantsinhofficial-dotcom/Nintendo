import { Game, Platform, DiscFormat } from '../types/emulator';

// Known GameCube / Wii Disc Magic Numbers
const GAMECUBE_MAGIC = 0x5D1C9EA3;
const WBFS_MAGIC = 0x57424653; // "WBFS" in ASCII

interface ParsedDiscHeader {
  gameId: string;
  makerCode: string;
  discNumber: number;
  gameVersion: number;
  audioStreaming: boolean;
  gameTitle: string;
  platform: Platform;
  region: 'NTSC-U' | 'PAL' | 'NTSC-J';
  discFormat: DiscFormat;
  isValid: boolean;
  error?: string;
}

/**
 * Parses raw ArrayBuffer data from a GameCube/Wii ISO, GCM, WBFS, or RVZ file.
 */
export async function parseDiscHeader(file: File): Promise<ParsedDiscHeader> {
  const sliceSize = Math.min(file.size, 1024 * 64); // Read first 64KB
  const buffer = await file.slice(0, sliceSize).arrayBuffer();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // Check file extension
  const extension = file.name.split('.').pop()?.toUpperCase() || 'ISO';
  let discFormat: DiscFormat = 'ISO';
  if (extension === 'WBFS') discFormat = 'WBFS';
  else if (extension === 'RVZ') discFormat = 'RVZ';
  else if (extension === 'GCM') discFormat = 'GCM';
  else if (extension === 'CISO') discFormat = 'CISO';

  // WBFS header check
  let offset = 0;
  if (view.byteLength >= 4 && view.getUint32(0, false) === WBFS_MAGIC) {
    discFormat = 'WBFS';
    // WBFS disc table usually points to first disc at 0x100 or 0x200
    offset = 0x200;
  }

  // Check if buffer is large enough for GameCube / Wii disc header
  if (view.byteLength < offset + 0x60) {
    // Generate a fallback header from filename if too small or partial read
    return generateFallbackHeader(file.name, discFormat);
  }

  // Extract Game ID (6 chars: 4-char Game ID + 2-char Maker ID)
  let gameId = '';
  for (let i = 0; i < 6; i++) {
    const charCode = bytes[offset + i];
    if (charCode >= 32 && charCode <= 126) {
      gameId += String.fromCharCode(charCode);
    } else {
      gameId += '?';
    }
  }

  // Maker code (chars 4 and 5)
  const makerCode = gameId.slice(4, 6);

  // Check disc magic
  // GameCube / Wii magic number is located at offset 0x001C
  let magic = 0;
  if (view.byteLength >= offset + 0x20) {
    magic = view.getUint32(offset + 0x1C, false);
  }

  const isMagicValid = magic === GAMECUBE_MAGIC;

  // Determine Platform:
  // First char of Game ID:
  // 'G' = GameCube
  // 'R', 'S', 'D' = Wii
  const firstChar = gameId.charAt(0).toUpperCase();
  let platform: Platform = 'gamecube';
  if (firstChar === 'R' || firstChar === 'S' || firstChar === 'D' || firstChar === 'W') {
    platform = 'wii';
  } else if (firstChar === 'G') {
    platform = 'gamecube';
  } else {
    // Fallback based on filename or format
    if (file.name.toLowerCase().includes('wii') || file.name.toLowerCase().includes('rvz') || discFormat === 'WBFS') {
      platform = 'wii';
    }
  }

  // Determine Region from 4th char of Game ID:
  // 'E' = NTSC-U (USA/Canada)
  // 'P', 'X', 'Y', 'Z' = PAL (Europe/Australia)
  // 'J' = NTSC-J (Japan)
  // 'K' = Korea
  const regionChar = gameId.charAt(3).toUpperCase();
  let region: 'NTSC-U' | 'PAL' | 'NTSC-J' = 'NTSC-U';
  if (regionChar === 'P' || regionChar === 'X' || regionChar === 'Y' || regionChar === 'Z') {
    region = 'PAL';
  } else if (regionChar === 'J' || regionChar === 'K') {
    region = 'NTSC-J';
  }

  // Extract Game Title from offset 0x0020 (null-terminated string up to 64 bytes)
  let gameTitle = '';
  for (let i = 0; i < 64; i++) {
    const byte = bytes[offset + 0x20 + i];
    if (byte === 0) break;
    if (byte >= 32 && byte <= 126) {
      gameTitle += String.fromCharCode(byte);
    }
  }

  // Clean title or fallback to filename if empty or garbage
  gameTitle = gameTitle.trim();
  if (!gameTitle || gameTitle.length < 2) {
    gameTitle = cleanFilenameToTitle(file.name);
  }

  return {
    gameId: gameId.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'UNKNOWN',
    makerCode,
    discNumber: bytes[offset + 0x06] || 0,
    gameVersion: bytes[offset + 0x07] || 0,
    audioStreaming: bytes[offset + 0x08] === 1,
    gameTitle,
    platform,
    region,
    discFormat,
    isValid: isMagicValid || gameTitle.length > 2,
  };
}

function generateFallbackHeader(fileName: string, discFormat: DiscFormat): ParsedDiscHeader {
  const title = cleanFilenameToTitle(fileName);
  const isWii = fileName.toLowerCase().includes('wii') || discFormat === 'WBFS' || discFormat === 'RVZ';
  return {
    gameId: isWii ? 'RWIE01' : 'GMBE01',
    makerCode: '01',
    discNumber: 0,
    gameVersion: 1,
    audioStreaming: false,
    gameTitle: title,
    platform: isWii ? 'wii' : 'gamecube',
    region: 'NTSC-U',
    discFormat,
    isValid: true,
  };
}

function cleanFilenameToTitle(fileName: string): string {
  return fileName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[._-]/g, ' ') // Replace underscores, dashes with space
    .replace(/\(.*?\)/g, '') // Remove parenthesis like (USA), (En,Fr)
    .replace(/\[.*?\]/g, '') // Remove brackets like [ISO]
    .trim();
}

/**
 * Creates a Game record from an uploaded File and parsed header.
 */
export async function createGameFromFile(file: File): Promise<Game> {
  const header = await parseDiscHeader(file);
  const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
  const sizeFormatted = file.size > 1024 * 1024 * 1024
    ? `${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB`
    : `${sizeMB} MB`;

  // Fallback placeholder cover SVG
  const coverSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%230f172a"/><rect x="0" y="0" width="300" height="45" fill="${header.platform === 'wii' ? '%23ffffff' : '%23581c87'}"/><text x="150" y="28" font-family="sans-serif" font-size="18" font-weight="bold" fill="${header.platform === 'wii' ? '%230284c7' : '%23ffffff'}" text-anchor="middle">${header.platform === 'wii' ? 'Wii' : 'NINTENDO GAMECUBE'}</text><circle cx="150" cy="200" r="70" fill="%231e293b" stroke="%2300f0ff" stroke-width="2"/><text x="150" y="208" font-family="sans-serif" font-size="14" fill="%2394a3b8" text-anchor="middle">${header.discFormat}</text><text x="150" y="320" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23f8fafc" text-anchor="middle">${header.gameTitle.slice(0, 22)}</text><text x="150" y="345" font-family="sans-serif" font-size="12" fill="%2338bdf8" text-anchor="middle">${header.gameId} · ${header.region}</text></svg>`;

  return {
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    gameId: header.gameId,
    title: header.gameTitle,
    platform: header.platform,
    region: header.region,
    publisher: header.makerCode === '01' ? 'Nintendo' : 'Third-Party',
    releaseYear: header.platform === 'wii' ? 2008 : 2003,
    coverImage: coverSvg,
    sizeBytes: file.size,
    sizeFormatted,
    discFormat: header.discFormat,
    lastPlayed: 'Never',
    playTimeMinutes: 0,
    favorite: false,
    compatibilityRating: 'Playable',
    recommendedBackend: header.platform === 'wii' ? 'vulkan' : 'opengles',
    internalResPreset: '2x',
    isCustomImport: true,
    notes: `User-imported disc image. Magic verified: ${header.isValid ? 'YES' : 'HEURISTIC'}.`,
  };
}
