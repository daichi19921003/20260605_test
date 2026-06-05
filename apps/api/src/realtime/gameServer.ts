import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";
import {
  type ClientEvent,
  type ServerEvent,
  type LocationSample,
  type UserId,
  type MatchId,
  type PlayerRole,
  evaluateTag,
  initialProximityState,
  isInsideFence,
  isImplausibleMove,
  type Geofence,
  type ProximityState,
} from "@oni/shared";

interface PlayerSession {
  userId: UserId;
  role: PlayerRole;
  socket: WebSocket;
  lastLocation: LocationSample | null;
  /** 鬼との近接状態(逃走者ごと)。 */
  proximity: ProximityState;
}

/** 1試合分のインメモリ状態。永続化は別途 DB に書き出す。 */
interface MatchRoom {
  matchId: MatchId;
  fence: Geofence;
  tagDistanceM: number;
  oniId: UserId | null;
  players: Map<UserId, PlayerSession>;
}

/**
 * リアルタイム鬼ごっこサーバー。
 *
 * - クライアントからの位置更新を受け取り
 * - チート(テレポート)・ジオフェンス境界を検証し
 * - 鬼⇔逃走者の距離から鬼交代を権威判定し
 * - 結果を全プレイヤーへブロードキャストする
 *
 * NOTE: Phase 4 で判定ロジックを本格実装。ここは骨組み + コア判定の結線。
 */
export class GameServer {
  private readonly wss: WebSocketServer;
  private readonly rooms = new Map<MatchId, MatchRoom>();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.wss.on("connection", (socket) => this.onConnection(socket));
  }

  private onConnection(socket: WebSocket): void {
    socket.on("message", (raw) => {
      let event: ClientEvent;
      try {
        event = JSON.parse(raw.toString()) as ClientEvent;
      } catch {
        return this.send(socket, { type: "error", message: "invalid_json" });
      }
      this.handleEvent(socket, event);
    });
  }

  private handleEvent(socket: WebSocket, event: ClientEvent): void {
    switch (event.type) {
      case "join_match":
        return this.join(socket, event.matchId, event.userId);
      case "leave_match":
        return this.leave(event.matchId, event.userId);
      case "location_update":
        return this.onLocation(event.matchId, event.userId, event.location);
    }
  }

  private join(socket: WebSocket, matchId: MatchId, userId: UserId): void {
    const room = this.rooms.get(matchId);
    if (!room) return this.send(socket, { type: "error", message: "match_not_found" });

    const role: PlayerRole = room.oniId === null ? "oni" : "runner";
    if (role === "oni") room.oniId = userId;

    room.players.set(userId, {
      userId,
      role,
      socket,
      lastLocation: null,
      proximity: initialProximityState(),
    });
    this.send(socket, { type: "match_state", matchId, status: "joined" });
  }

  private leave(matchId: MatchId, userId: UserId): void {
    this.rooms.get(matchId)?.players.delete(userId);
  }

  private onLocation(matchId: MatchId, userId: UserId, location: LocationSample): void {
    const room = this.rooms.get(matchId);
    const player = room?.players.get(userId);
    if (!room || !player) return;

    // 1) チート検知: 直前サンプルからの移動速度が非現実的なら脱落
    if (player.lastLocation && isImplausibleMove(player.lastLocation, location)) {
      this.eliminate(room, player, "cheat");
      return;
    }
    player.lastLocation = location;

    // 2) ジオフェンス境界チェック
    if (!isInsideFence(location, room.fence)) {
      // MVP: 即脱落。Phase 5 で猶予秒数つき警告に拡張。
      this.eliminate(room, player, "out_of_bounds");
      return;
    }

    // 3) 鬼交代判定(逃走者の位置更新時のみ、鬼との距離を評価)
    if (player.role === "runner" && room.oniId) {
      const oni = room.players.get(room.oniId);
      if (oni?.lastLocation) {
        const judgment = evaluateTag(
          oni.lastLocation,
          location,
          location.timestamp,
          room.tagDistanceM,
          player.proximity,
        );
        player.proximity = judgment.state;
        if (judgment.tagged) this.switchOni(room, userId);
      }
    }

    this.broadcastPositions(room);
  }

  /** 役割交代: 新しい鬼を設定し、旧鬼を逃走者に戻す。 */
  private switchOni(room: MatchRoom, newOni: UserId): void {
    const previousOni = room.oniId;
    if (previousOni === null) return;

    const prev = room.players.get(previousOni);
    const next = room.players.get(newOni);
    if (prev) prev.role = "runner";
    if (next) next.role = "oni";
    room.oniId = newOni;

    this.broadcast(room, {
      type: "role_changed",
      matchId: room.matchId,
      newOni,
      previousOni,
      at: Date.now(),
    });
  }

  private eliminate(room: MatchRoom, player: PlayerSession, reason: "out_of_bounds" | "cheat"): void {
    room.players.delete(player.userId);
    this.broadcast(room, { type: "eliminated", matchId: room.matchId, userId: player.userId, reason });
  }

  private broadcastPositions(room: MatchRoom): void {
    const players = [...room.players.values()]
      .filter((p) => p.lastLocation)
      .map((p) => ({ userId: p.userId, role: p.role, location: p.lastLocation! }));
    this.broadcast(room, { type: "players_positions", matchId: room.matchId, players });
  }

  private broadcast(room: MatchRoom, event: ServerEvent): void {
    for (const p of room.players.values()) this.send(p.socket, event);
  }

  private send(socket: WebSocket, event: ServerEvent): void {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(event));
  }

  /** 試合開始時にルームを登録する(REST 側から呼ぶ想定の骨組み)。 */
  registerRoom(matchId: MatchId, fence: Geofence, tagDistanceM: number): void {
    this.rooms.set(matchId, { matchId, fence, tagDistanceM, oniId: null, players: new Map() });
  }
}
