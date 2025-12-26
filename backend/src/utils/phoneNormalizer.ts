/**
 * Normalizes phone number by removing spaces, dashes, and handling country codes
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // Handle Uzbek phone numbers (country code +998)
  if (normalized.startsWith('998')) {
    normalized = '+' + normalized;
  } else if (normalized.startsWith('+998')) {
    // Already has country code
  } else if (normalized.length === 9) {
    // Local Uzbek number without country code
    normalized = '+998' + normalized;
  } else if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }
  
  return normalized;
}

