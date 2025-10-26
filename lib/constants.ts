/**
 * Application constants
 * Centralizes magic numbers and configuration values
 */

export const AUTH = {
  SESSION_POLL_MAX_ATTEMPTS: 10,
  SESSION_POLL_INTERVAL_MS: 250,
} as const;

export const STORAGE = {
  MAX_FILE_SIZE_MB: 5,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,
  SIGNED_URL_EXPIRY_SECONDS: 3600,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const,
  COMPRESSION_MAX_WIDTH: 1200,
  COMPRESSION_MAX_HEIGHT: 1200,
  COMPRESSION_QUALITY: 0.85,
} as const;

export const LOCAL_STORAGE_KEYS = {
  TERM_ID: 'kauri.termId',
} as const;

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  POST_AUTH: '/post-auth',
} as const;
