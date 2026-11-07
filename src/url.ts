import { compressToBase64, decompressFromBase64 } from "lz-string";
import { Board, sanitizeBoard } from "./model";

/** Encode board state to a URL-safe, compressed string (no leading "#"). */
export function encodeBoard(board: Board): string {
  const json = JSON.stringify(board);
  return compressToBase64(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Decode a hash payload (without leading "#"). Returns null if invalid. */
export function decodeBoard(payload: string): Board | null {
  if (!payload) return null;
  try {
    let s = payload.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const board = JSON.parse(decompressFromBase64(s));
    return sanitizeBoard(board);
  } catch {
    return null;
  }
}
