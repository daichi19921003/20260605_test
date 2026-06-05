import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { LOCATION_BROADCAST_INTERVAL_MS, type LocationSample, type MatchId, type UserId } from "@oni/shared";
import type { RealtimeClient } from "./realtime.ts";

export type PermissionState = "pending" | "granted" | "denied";

/**
 * 試合中の位置追跡フック。
 * 権限を要求し、一定間隔で GPS を取得して RealtimeClient で送信する。
 */
export function useLocationTracking(
  client: RealtimeClient | null,
  matchId: MatchId | null,
  userId: UserId,
  active: boolean,
) {
  const [permission, setPermission] = useState<PermissionState>("pending");
  const [last, setLast] = useState<LocationSample | null>(null);
  const subscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!active || !client || !matchId) return;

    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== "granted") return setPermission("denied");
      setPermission("granted");

      subscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: LOCATION_BROADCAST_INTERVAL_MS,
          distanceInterval: 1,
        },
        (pos) => {
          const sample: LocationSample = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracyM: pos.coords.accuracy ?? 999,
            timestamp: pos.timestamp,
          };
          setLast(sample);
          client.sendLocation(matchId, userId, sample);
        },
      );
    })();

    return () => {
      cancelled = true;
      subscription.current?.remove();
      subscription.current = null;
    };
  }, [client, matchId, userId, active]);

  return { permission, last };
}
