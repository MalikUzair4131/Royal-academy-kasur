import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessTokenWithReason, TokenPayload } from '@/lib/jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload;
}

/**
 * withAuth — verifies Bearer token.
 * Returns the decoded payload on success, or null on failure.
 * When the token is expired it returns null but also sets `req._tokenExpired = true`
 * so that callers can return the correct TOKEN_EXPIRED response code.
 */
export async function withAuth(request: AuthenticatedRequest): Promise<TokenPayload | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const { payload, isExpired } = verifyAccessTokenWithReason(token);

  if (payload) {
    request.user = payload;
    return payload;
  }

  // Store expiry reason on the request so the handler can distinguish cases
  (request as any)._tokenExpired = isExpired;
  return null;
}

/** Call this inside a handler after withAuth returns null */
export function authError(request: AuthenticatedRequest) {
  const isExpired = (request as any)._tokenExpired;
  if (isExpired) {
    return NextResponse.json(
      { message: 'Token expired', code: 'TOKEN_EXPIRED' },
      { status: 401 }
    );
  }
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}

/** Shortcut: still works for routes that don't need to distinguish expired vs missing */
export function unauthorized() {
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
}

export function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

export function notFound() {
  return NextResponse.json({ message: 'Not found' }, { status: 404 });
}

export function serverError(message = 'Internal server error') {
  return NextResponse.json({ message }, { status: 500 });
}
