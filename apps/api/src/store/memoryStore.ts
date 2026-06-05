import type { Area, Block, Match, Report, User, UserStats } from "@oni/shared";

/**
 * インメモリのデータストア。
 *
 * MVP/テスト用。本番は同じインターフェイスを PostgreSQL/PostGIS で実装して
 * 差し替える(db/schema.sql 参照)。サービス層はこの形だけに依存する。
 */
export class MemoryStore {
  readonly users = new Map<string, User>();
  readonly areas = new Map<string, Area>();
  readonly matches = new Map<string, Match>();
  readonly reports = new Map<string, Report>();
  readonly stats = new Map<string, UserStats>();
  readonly blocks: Block[] = [];
}
