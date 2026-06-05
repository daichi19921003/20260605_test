import { randomUUID } from "node:crypto";
import type { Report, ReportReason } from "@oni/shared";
import type { MemoryStore } from "../store/memoryStore.ts";

export interface CreateReportInput {
  reporterId: string;
  targetId: string;
  matchId?: string | null;
  reason: ReportReason;
  detail?: string;
}

/** 通報・ブロックなど対人安全機能。 */
export class SafetyService {
  constructor(private readonly store: MemoryStore) {}

  report(input: CreateReportInput): Report {
    if (input.reporterId === input.targetId) throw new Error("cannot_report_self");
    const report: Report = {
      id: randomUUID(),
      reporterId: input.reporterId,
      targetId: input.targetId,
      matchId: input.matchId ?? null,
      reason: input.reason,
      detail: input.detail ?? "",
      createdAt: new Date().toISOString(),
    };
    this.store.reports.set(report.id, report);
    return report;
  }

  block(userId: string, blockedUserId: string): void {
    if (userId === blockedUserId) throw new Error("cannot_block_self");
    if (this.isBlocked(userId, blockedUserId)) return;
    this.store.blocks.push({ userId, blockedUserId, createdAt: new Date().toISOString() });
  }

  /** どちらかがブロックしていれば true(マッチングから相互に除外)。 */
  isBlocked(a: string, b: string): boolean {
    return this.store.blocks.some(
      (x) =>
        (x.userId === a && x.blockedUserId === b) ||
        (x.userId === b && x.blockedUserId === a),
    );
  }
}
