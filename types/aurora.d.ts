export interface SearchInfo {
  depth: number;
  score: number;
  nodes: number;
  nps: number;
  time: number;
  pv: string;
  book?: boolean;
}

export interface SearchResult {
  move: number;
  score: number;
  nodes: number;
  pv?: string[];
  book?: boolean;
}

export interface FenCheck {
  ok: boolean;
  errors: string[];
}

export interface OpeningHit {
  eco: string;
  name: string;
  u: string[];
}

export declare class Aurora {
  fen(): string;
  setFen(fen: string): this;
  newGame(fen?: string): this;
  chess960(id: number): this;
  legal(): string[];
  play(uci: string): boolean;
  undo(): void;
  eval(): number;
  tb(): number | null;
  opening(): OpeningHit | null;
  go(opts?: { time?: number; depth?: number; useBook?: boolean }): SearchResult;
  goSkilled(level: number, opts?: object): SearchResult;
  analyse(k?: number, time?: number): Array<{ multipv: number; uci: string; score: number }>;
  pgn(headers?: Record<string, string>): string;
}

export declare function validateFen(fen: string): FenCheck;
export declare function chess960Fen(id: number): string;
export declare function perft(pos: unknown, depth: number): number;
