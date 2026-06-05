import { randomUUID } from "node:crypto";
import type { PrivacySettings, User } from "@oni/shared";
import type { MemoryStore } from "../store/memoryStore.ts";

const DEFAULT_PRIVACY: PrivacySettings = {
  shareLocationOutsideMatch: false,
  allowTrailSharing: false,
};

export class UserService {
  constructor(private readonly store: MemoryStore) {}

  create(displayName: string, ageVerified: boolean): User {
    const user: User = {
      id: randomUUID(),
      displayName,
      ageVerified,
      privacy: { ...DEFAULT_PRIVACY },
      createdAt: new Date().toISOString(),
    };
    this.store.users.set(user.id, user);
    return user;
  }

  get(id: string): User | undefined {
    return this.store.users.get(id);
  }

  updatePrivacy(id: string, privacy: Partial<PrivacySettings>): User {
    const user = this.store.users.get(id);
    if (!user) throw new Error("user_not_found");
    user.privacy = { ...user.privacy, ...privacy };
    return user;
  }
}
