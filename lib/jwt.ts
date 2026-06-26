import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'royal-academy-super-secret-key-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'royal-academy-refresh-secret-2026';
// Read expiry from env, fallback to 1 hour (not 15m — too short causes constant logouts)
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface TokenPayload {
  _id: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES } as any);
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES } as any);
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// Returns null on invalid, and sets isExpired flag for callers that need it
export function verifyAccessTokenWithReason(token: string): { payload: TokenPayload | null; isExpired: boolean } {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return { payload, isExpired: false };
  } catch (err: any) {
    return { payload: null, isExpired: err?.name === 'TokenExpiredError' };
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
