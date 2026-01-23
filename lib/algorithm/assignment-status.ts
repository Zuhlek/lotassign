/**
 * Assignment Status & Failure Reasons
 *
 * This module defines all possible states and failure reasons for caller assignments.
 * Used by both the algorithm (to generate explanations) and UI (to display indicators).
 */

// ============================================
// ASSIGNMENT STATUS CODES
// ============================================

export enum AssignmentStatus {
  // Success states
  ASSIGNED = "assigned",
  ASSIGNED_OPTIMAL = "assigned_optimal",
  ASSIGNED_SUBOPTIMAL = "assigned_suboptimal",

  // Locked states
  FINAL = "final",
  MANUAL = "manual",

  // Failure states
  UNASSIGNED = "unassigned",
  CONFLICT = "conflict",
}

// ============================================
// FAILURE REASON CODES
// ============================================

export enum FailureReason {
  // Hard constraint failures (cannot assign)
  NO_CALLER_AVAILABLE = "no_caller_available",
  NO_LANGUAGE_MATCH = "no_language_match",
  ALL_CALLERS_BUSY = "all_callers_busy",
  LOT_GAP_VIOLATION = "lot_gap_violation",
  FINAL_ASSIGNMENT_CONFLICT = "final_conflict",

  // Soft constraint compromises (assigned but suboptimal)
  PREFERRED_CALLER_UNAVAILABLE = "preferred_unavailable",
  PRIORITY_CALLER_UNAVAILABLE = "priority_unavailable",
  CONTINUITY_BROKEN = "continuity_broken",
  LANGUAGE_FALLBACK_USED = "language_fallback",
  LOAD_IMBALANCE = "load_imbalance",
}

// ============================================
// CONSTRAINT NOTE CODES (for UI display)
// ============================================

export enum ConstraintNote {
  // Positive outcomes
  PREFERRED_CALLER_MATCH = "preferred_match",
  PRIORITY_CALLER_MATCH = "priority_match",
  CONTINUITY_MAINTAINED = "continuity_ok",
  LANGUAGE_MATCH = "language_ok",
  OPTIMAL_ASSIGNMENT = "optimal",

  // Locked by user
  LOCKED_FINAL = "locked_final",
  LOCKED_MANUAL = "locked_manual",

  // Warnings (assigned but issues)
  PREFERRED_NOT_AVAILABLE = "preferred_not_available",
  PRIORITY_NOT_AVAILABLE = "priority_not_available",
  DIFFERENT_CALLER_NEEDED = "different_caller",
  LANGUAGE_FALLBACK = "language_fallback",
  HIGH_WORKLOAD = "high_workload",

  // Errors (not assigned)
  NO_VALID_CALLER = "no_valid_caller",
  ALL_BUSY = "all_busy",
  NO_LANGUAGE_CALLER = "no_language_caller",
}

// ============================================
// HUMAN-READABLE MESSAGES
// ============================================

export const FAILURE_MESSAGES: Record<FailureReason, string> = {
  [FailureReason.NO_CALLER_AVAILABLE]: "No caller available for this assignment",
  [FailureReason.NO_LANGUAGE_MATCH]: "No caller speaks the required language",
  [FailureReason.ALL_CALLERS_BUSY]: "All callers are occupied by other lots",
  [FailureReason.LOT_GAP_VIOLATION]: "Assignment would violate lot gap constraint",
  [FailureReason.FINAL_ASSIGNMENT_CONFLICT]: "Conflicts with a locked final assignment",
  [FailureReason.PREFERRED_CALLER_UNAVAILABLE]: "Preferred caller was not available",
  [FailureReason.PRIORITY_CALLER_UNAVAILABLE]: "Priority caller was not available",
  [FailureReason.CONTINUITY_BROKEN]: "Could not maintain same caller as previous lot",
  [FailureReason.LANGUAGE_FALLBACK_USED]: "Used caller without exact language match",
  [FailureReason.LOAD_IMBALANCE]: "Assignment contributes to workload imbalance",
};

export const CONSTRAINT_MESSAGES: Record<ConstraintNote, string> = {
  [ConstraintNote.PREFERRED_CALLER_MATCH]: "Assigned to preferred caller",
  [ConstraintNote.PRIORITY_CALLER_MATCH]: "Assigned to priority caller",
  [ConstraintNote.CONTINUITY_MAINTAINED]: "Same caller as previous lot",
  [ConstraintNote.LANGUAGE_MATCH]: "Caller speaks bidder's language",
  [ConstraintNote.OPTIMAL_ASSIGNMENT]: "Optimal assignment",
  [ConstraintNote.LOCKED_FINAL]: "Locked by user (final)",
  [ConstraintNote.LOCKED_MANUAL]: "Manually assigned",
  [ConstraintNote.PREFERRED_NOT_AVAILABLE]: "Preferred caller unavailable (lot gap)",
  [ConstraintNote.PRIORITY_NOT_AVAILABLE]: "Priority caller unavailable",
  [ConstraintNote.DIFFERENT_CALLER_NEEDED]: "Different caller than previous lot",
  [ConstraintNote.LANGUAGE_FALLBACK]: "No caller with exact language match",
  [ConstraintNote.HIGH_WORKLOAD]: "Caller has above-average workload",
  [ConstraintNote.NO_VALID_CALLER]: "No valid caller found",
  [ConstraintNote.ALL_BUSY]: "All callers busy at this lot",
  [ConstraintNote.NO_LANGUAGE_CALLER]: "No caller for required language",
};

// ============================================
// UI INDICATOR TYPES
// ============================================

export type IndicatorSeverity = "success" | "info" | "warning" | "error";

export interface AssignmentIndicator {
  code: ConstraintNote | FailureReason;
  severity: IndicatorSeverity;
  message: string;
  details?: string;
}

export function getIndicatorSeverity(code: ConstraintNote | FailureReason): IndicatorSeverity {
  // Success indicators
  if ([
    ConstraintNote.PREFERRED_CALLER_MATCH,
    ConstraintNote.PRIORITY_CALLER_MATCH,
    ConstraintNote.CONTINUITY_MAINTAINED,
    ConstraintNote.LANGUAGE_MATCH,
    ConstraintNote.OPTIMAL_ASSIGNMENT,
  ].includes(code as ConstraintNote)) {
    return "success";
  }

  // Info indicators (locked states)
  if ([
    ConstraintNote.LOCKED_FINAL,
    ConstraintNote.LOCKED_MANUAL,
  ].includes(code as ConstraintNote)) {
    return "info";
  }

  // Warning indicators (suboptimal but assigned)
  if ([
    ConstraintNote.PREFERRED_NOT_AVAILABLE,
    ConstraintNote.PRIORITY_NOT_AVAILABLE,
    ConstraintNote.DIFFERENT_CALLER_NEEDED,
    ConstraintNote.LANGUAGE_FALLBACK,
    ConstraintNote.HIGH_WORKLOAD,
    FailureReason.PREFERRED_CALLER_UNAVAILABLE,
    FailureReason.PRIORITY_CALLER_UNAVAILABLE,
    FailureReason.CONTINUITY_BROKEN,
    FailureReason.LANGUAGE_FALLBACK_USED,
    FailureReason.LOAD_IMBALANCE,
  ].includes(code as ConstraintNote | FailureReason)) {
    return "warning";
  }

  // Error indicators (not assigned)
  return "error";
}

export function createIndicator(
  code: ConstraintNote | FailureReason,
  details?: string
): AssignmentIndicator {
  const isFailure = Object.values(FailureReason).includes(code as FailureReason);
  const message = isFailure
    ? FAILURE_MESSAGES[code as FailureReason]
    : CONSTRAINT_MESSAGES[code as ConstraintNote];

  return {
    code,
    severity: getIndicatorSeverity(code),
    message,
    details,
  };
}

// ============================================
// DETAILED ASSIGNMENT RESULT
// ============================================

export interface DetailedAssignmentResult {
  lotId: number;
  bidderId: number;
  callerId?: number;
  status: AssignmentStatus;
  indicators: AssignmentIndicator[];
  score?: number;
}

/**
 * Parses a constraint note string into structured indicators.
 * Constraint notes from the solver are strings like "Preferred caller match"
 * This converts them to structured indicator objects.
 */
export function parseConstraintNote(note: string): AssignmentIndicator[] {
  const indicators: AssignmentIndicator[] = [];
  const lowerNote = note.toLowerCase();

  // Map note strings to codes
  if (lowerNote.includes("locked") || lowerNote.includes("final")) {
    indicators.push(createIndicator(ConstraintNote.LOCKED_FINAL));
  }
  if (lowerNote.includes("preferred caller match")) {
    indicators.push(createIndicator(ConstraintNote.PREFERRED_CALLER_MATCH));
  }
  if (lowerNote.includes("priority")) {
    const match = note.match(/priority #(\d+)/i);
    if (match) {
      indicators.push(createIndicator(
        ConstraintNote.PRIORITY_CALLER_MATCH,
        `Rank ${match[1]}`
      ));
    }
  }
  if (lowerNote.includes("continuity") || lowerNote.includes("same caller")) {
    indicators.push(createIndicator(ConstraintNote.CONTINUITY_MAINTAINED));
  }
  if (lowerNote.includes("language fallback") || lowerNote.includes("no language match")) {
    indicators.push(createIndicator(ConstraintNote.LANGUAGE_FALLBACK));
  }

  // If no specific note parsed, return generic based on content
  if (indicators.length === 0 && note.length > 0) {
    indicators.push({
      code: ConstraintNote.OPTIMAL_ASSIGNMENT,
      severity: "info",
      message: note,
    });
  }

  return indicators;
}
