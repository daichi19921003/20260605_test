import type { LocationSample, MatchId, PlayerRole, UserId } from "./types.ts";

/** クライアント → サーバー の WebSocket メッセージ契約。 */
export type ClientEvent =
  | { type: "join_match"; matchId: MatchId; userId: UserId }
  | { type: "leave_match"; matchId: MatchId; userId: UserId }
  | { type: "location_update"; matchId: MatchId; userId: UserId; location: LocationSample };

/** サーバー → クライアント の WebSocket メッセージ契約。 */
export type ServerEvent =
  | { type: "match_state"; matchId: MatchId; status: string }
  | {
      type: "players_positions";
      matchId: MatchId;
      players: Array<{ userId: UserId; role: PlayerRole; location: LocationSample }>;
    }
  | { type: "role_changed"; matchId: MatchId; newOni: UserId; previousOni: UserId; at: number }
  | { type: "geofence_warning"; matchId: MatchId; userId: UserId; graceSecLeft: number }
  | { type: "eliminated"; matchId: MatchId; userId: UserId; reason: "out_of_bounds" | "cheat" }
  | { type: "error"; message: string };
