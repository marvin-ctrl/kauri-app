/**
 * Validation utilities
 */

export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function sanitizeString(input: string, maxLength = 255): string {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, maxLength);
}

export function sanitizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  return isValidEmail(trimmed) ? trimmed : null;
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}
