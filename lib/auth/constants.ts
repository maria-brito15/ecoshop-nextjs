// lib/auth/constants.ts

/**
 * Session constants (ADR-0021). No Node dependencies: the middleware (edge runtime)
 * also imports this file.
 *
 * Session = short-lived ACCESS token (JWT, `token` cookie) + opaque REFRESH token
 * stored in Redis (`refresh` cookie), which can be revoked.
 */

/** Cookie holding the access JWT. */
export const ACCESS_COOKIE = "token";

/** Cookie holding the refresh token (opaque value; proof of validity lives in Redis). */
export const REFRESH_COOKIE = "refresh";

/**
 * Access token lifetime. Short on purpose: it is the maximum interval in which a revoked
 * access keeps working, since the JWT is verified without querying Redis.
 * Initial value chosen by spec 010, without usage measurements ❔.
 */
export const ACCESS_TOKEN_SECONDS = 15 * 60;

/** Maximum session length without a new login (keeps the 7 days from ADR-0007). */
export const REFRESH_TOKEN_SECONDS = 7 * 24 * 60 * 60;
