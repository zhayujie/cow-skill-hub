export function isSecureRequest(request: Request): boolean {
  return new URL(request.url).protocol === 'https:';
}

export const OAUTH_STATE_COOKIE = 'oauth_state';
export const AUTH_TOKEN_COOKIE = 'cow_token';

export const JWT_TTL_SECONDS = 7 * 24 * 60 * 60;
export const OAUTH_STATE_MAX_AGE = 600;
