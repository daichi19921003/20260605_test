import type { GameServer } from "./gameServer.ts";

/** 起動時に生成される GameServer をルートから参照するためのホルダー。 */
let instance: GameServer | null = null;

export const setGameServer = (g: GameServer): void => {
  instance = g;
};

export const getGameServer = (): GameServer | null => instance;
