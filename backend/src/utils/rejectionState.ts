/**
 * In-memory storage for rejection flow state
 * Maps userId to rejection state (leadId)
 */
const rejectionStateMap = new Map<string, { leadId: string }>();

/**
 * Set rejection state for a user
 */
export function setRejectionState(userId: string, leadId: string): void {
  rejectionStateMap.set(userId, { leadId });
}

/**
 * Get rejection state for a user
 */
export function getRejectionState(userId: string): { leadId: string } | null {
  return rejectionStateMap.get(userId) || null;
}

/**
 * Clear rejection state for a user
 */
export function clearRejectionState(userId: string): void {
  rejectionStateMap.delete(userId);
}

