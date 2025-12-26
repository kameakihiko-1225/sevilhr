/**
 * In-memory storage for rejection flow state
 * Maps userId to rejection state (leadId, rejectedBy, and menu message info)
 */
const rejectionStateMap = new Map<string, { 
  leadId: string; 
  rejectedBy: string;
  menuMessageId?: number;
  menuChatId?: number | string;
}>();

/**
 * Set rejection state for a user
 */
export function setRejectionState(
  userId: string, 
  leadId: string, 
  rejectedBy: string,
  menuMessageId?: number,
  menuChatId?: number | string
): void {
  rejectionStateMap.set(userId, { leadId, rejectedBy, menuMessageId, menuChatId });
}

/**
 * Get rejection state for a user
 */
export function getRejectionState(userId: string): { 
  leadId: string; 
  rejectedBy: string;
  menuMessageId?: number;
  menuChatId?: number | string;
} | null {
  return rejectionStateMap.get(userId) || null;
}

/**
 * Clear rejection state for a user
 */
export function clearRejectionState(userId: string): void {
  rejectionStateMap.delete(userId);
}

