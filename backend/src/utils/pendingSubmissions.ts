/**
 * In-memory storage for pending form submissions
 * Maps sessionId to form data, expires after 30 minutes
 */
const pendingSubmissions = new Map<string, { data: any; timestamp: number }>();

// Clean up expired submissions every 5 minutes
setInterval(() => {
  const now = Date.now();
  const expireTime = 30 * 60 * 1000; // 30 minutes
  for (const [sessionId, submission] of pendingSubmissions.entries()) {
    if (now - submission.timestamp > expireTime) {
      pendingSubmissions.delete(sessionId);
      console.log(`[PendingSubmissions] Cleaned up expired session: ${sessionId}`);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

/**
 * Store pending form submission
 */
export function storePendingSubmission(sessionId: string, formData: any): void {
  pendingSubmissions.set(sessionId, {
    data: formData,
    timestamp: Date.now(),
  });
  console.log(`[PendingSubmissions] Stored form data for session: ${sessionId}`);
}

/**
 * Retrieve and delete pending form submission (one-time use)
 */
export function retrievePendingSubmission(sessionId: string): any | null {
  const submission = pendingSubmissions.get(sessionId);
  
  if (!submission) {
    return null;
  }

  // Check if expired
  const now = Date.now();
  const expireTime = 30 * 60 * 1000; // 30 minutes
  if (now - submission.timestamp > expireTime) {
    pendingSubmissions.delete(sessionId);
    return null;
  }

  // Return the form data and delete it (one-time use)
  pendingSubmissions.delete(sessionId);
  console.log(`[PendingSubmissions] Retrieved and deleted form data for session: ${sessionId}`);
  
  return submission.data;
}

