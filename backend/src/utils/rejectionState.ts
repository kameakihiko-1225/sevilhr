/**
 * In-memory storage for rejection flow state
 * Maps userId to rejection state (leadId and rejectedBy)
 */
const rejectionStateMap = new Map<string, { leadId: string; rejectedBy: string }>();

/**
 * Set rejection state for a user
 */
export function setRejectionState(userId: string, leadId: string, rejectedBy: string): void {
  rejectionStateMap.set(userId, { leadId, rejectedBy });
}

/**
 * Get rejection state for a user
 */
export function getRejectionState(userId: string): { leadId: string; rejectedBy: string } | null {
  return rejectionStateMap.get(userId) || null;
}

/**
 * Clear rejection state for a user
 */
export function clearRejectionState(userId: string): void {
  rejectionStateMap.delete(userId);
}

