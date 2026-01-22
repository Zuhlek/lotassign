import { PlanningSnapshot } from "@/lib/actions/assignment-logic.actions";
import { computeAssignmentsCSP, AssignmentResult, AssignmentOptions } from "@/lib/assignment.service";

export interface AssignmentPreview {
  result: AssignmentResult;
  changes: {
    newAssignments: number;
    changedAssignments: number;
    removedAssignments: number;
  };
  warnings: string[];
  conflicts: Array<{
    lotId: number;
    bidderId: number;
    reason: string;
  }>;
}

/**
 * Previews what would happen if assignments were computed with given options.
 * Compares the new assignments against current assignments to show changes.
 */
export function previewAssignments(
  snapshot: PlanningSnapshot,
  currentAssignments: Map<string, number>, // "lotId:bidderId" -> callerId
  options: AssignmentOptions
): AssignmentPreview {
  const result = computeAssignmentsCSP(snapshot, options);

  // Calculate changes
  let newAssignments = 0;
  let changedAssignments = 0;
  let removedAssignments = 0;

  const newKeys = new Set(result.detailed?.assignments.keys() ?? []);
  const oldKeys = new Set(currentAssignments.keys());

  for (const key of newKeys) {
    if (!oldKeys.has(key)) {
      newAssignments++;
    } else if (result.detailed?.assignments.get(key) !== currentAssignments.get(key)) {
      changedAssignments++;
    }
  }

  for (const key of oldKeys) {
    if (!newKeys.has(key)) {
      removedAssignments++;
    }
  }

  // Generate warnings
  const warnings: string[] = [];

  if (result.unscheduled.length > 0) {
    warnings.push(`${result.unscheduled.length} bidder(s) could not be assigned`);
  }

  if (result.detailed && result.detailed.scoreBreakdown.preferences === 0 &&
      snapshot.lotBidders.some(lb => lb.preferredCallerId !== undefined)) {
    warnings.push("Some preferences could not be honored");
  }

  // Count callers used
  const callersUsed = new Set(result.detailed?.assignments.values() ?? []);
  const totalCallers = new Set(snapshot.auctionCallers.map(ac => ac.callerId)).size;
  if (callersUsed.size < totalCallers && totalCallers > 1) {
    warnings.push(`Only ${callersUsed.size} of ${totalCallers} callers are being used`);
  }

  // Identify conflicts
  const conflicts = (result.detailed?.unassigned ?? []).map(({ lotId, bidderId }) => {
    const bidder = snapshot.bidders.find(b => b.id === bidderId);
    const lot = snapshot.lots.find(l => l.id === lotId);
    const bidderLanguages = bidder?.languages?.join(", ") || "any";

    // Try to determine the reason
    let reason = `No available caller for ${bidder?.name ?? "Unknown"} on Lot ${lot?.number ?? lotId}`;

    // Check if it's a language issue
    const activeCallerIds = new Set(snapshot.auctionCallers.map(ac => ac.callerId));
    const activeCallers = snapshot.callers.filter(c => activeCallerIds.has(c.id!));
    const hasLanguageMatch = activeCallers.some(caller => {
      if (!bidder?.languages?.length) return true;
      if (!caller.languages?.length) return true;
      return bidder.languages.some(bl => caller.languages.includes(bl));
    });

    if (!hasLanguageMatch) {
      reason = `No caller speaks ${bidderLanguages} (required by ${bidder?.name ?? "Unknown"})`;
    } else {
      reason = `All compatible callers are busy at Lot ${lot?.number ?? lotId}`;
    }

    return {
      lotId,
      bidderId,
      reason,
    };
  });

  return {
    result,
    changes: {
      newAssignments,
      changedAssignments,
      removedAssignments,
    },
    warnings,
    conflicts,
  };
}

/**
 * Gets a summary of changes for display.
 */
export function getPreviewSummary(preview: AssignmentPreview): string {
  const parts: string[] = [];

  if (preview.changes.newAssignments > 0) {
    parts.push(`${preview.changes.newAssignments} new`);
  }
  if (preview.changes.changedAssignments > 0) {
    parts.push(`${preview.changes.changedAssignments} changed`);
  }
  if (preview.changes.removedAssignments > 0) {
    parts.push(`${preview.changes.removedAssignments} removed`);
  }

  if (parts.length === 0) {
    return "No changes";
  }

  return parts.join(", ");
}
