import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, TokenPayload } from '@/lib/jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload;
}

export async function withAuth(request: AuthenticatedRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);

  if (!payload) {
    return null;
  }

  request.user = payload;
  return payload;
}

export function unauthorized() {
  return NextResponse.json(
    { message: 'Unauthorized' },
    { status: 401 }
  );
}

export function forbidden() {
  return NextResponse.json(
    { message: 'Forbidden' },
    { status: 403 }
  );
}

export function badRequest(message: string) {
  return NextResponse.json(
    { message },
    { status: 400 }
  );
}

export function notFound() {
  return NextResponse.json(
    { message: 'Not found' },
    { status: 404 }
  );
}

export function serverError(message = 'Internal server error') {
  return NextResponse.json(
    { message },
    { status: 500 }
  );
}
