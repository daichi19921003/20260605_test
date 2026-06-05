import type { Area, LatLng, Match, MatchResult, User, UserStats } from "@oni/shared";

/** Oni API の REST クライアント。 */
export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  private async json<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`api_error_${res.status}`);
    return (res.status === 204 ? undefined : await res.json()) as T;
  }

  createUser(displayName: string, ageVerified: boolean): Promise<User> {
    return this.json("/users", { method: "POST", body: JSON.stringify({ displayName, ageVerified }) });
  }

  getStats(userId: string): Promise<UserStats> {
    return this.json(`/users/${userId}/stats`);
  }

  nearbyAreas(point: LatLng, withinM = 5000): Promise<Area[]> {
    return this.json(`/areas?lat=${point.lat}&lng=${point.lng}&within=${withinM}`);
  }

  createMatch(areaId: string): Promise<Match> {
    return this.json("/matches", { method: "POST", body: JSON.stringify({ areaId }) });
  }

  joinMatch(matchId: string, userId: string): Promise<Match> {
    return this.json(`/matches/${matchId}/join`, { method: "POST", body: JSON.stringify({ userId }) });
  }

  startMatch(matchId: string): Promise<Match> {
    return this.json(`/matches/${matchId}/start`, { method: "POST" });
  }

  finishMatch(matchId: string): Promise<MatchResult> {
    return this.json(`/matches/${matchId}/finish`, { method: "POST" });
  }

  report(input: { reporterId: string; targetId: string; matchId?: string; reason: string; detail?: string }): Promise<unknown> {
    return this.json("/reports", { method: "POST", body: JSON.stringify(input) });
  }
}
