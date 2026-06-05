import { MemoryStore } from "./store/memoryStore.ts";
import { UserService } from "./services/userService.ts";
import { AreaService } from "./services/areaService.ts";
import { MatchService } from "./services/matchService.ts";
import { SafetyService } from "./services/safetyService.ts";
import { StatsService } from "./services/statsService.ts";

/** アプリ全体の合成ルート(依存の組み立て)。 */
const store = new MemoryStore();

export const services = {
  store,
  users: new UserService(store),
  areas: new AreaService(store),
  matches: new MatchService(store),
  safety: new SafetyService(store),
  stats: new StatsService(store),
} as const;

export type Services = typeof services;
