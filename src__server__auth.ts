import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AdminUser } from '../types';
import { storeDB } from './db';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'ammiexpress_secret_key_prod_984210573';

export interface AuthTokenPayload {
  id: string;
  username: string;
  email: string;
  role: string;
  tokenVersion?: number;
  updatedAt?: string;
  iat?: number;
  exp?: number;
}

export function generateToken(user: AdminUser): string {
  const payload: AuthTokenPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion || 1,
    updatedAt: user.updatedAt
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch (e) {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  adminUser?: AuthTokenPayload;
}

export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }

  // Session Invalidation check against DB
  const admin = storeDB.getAdminUsers().find(u => u.id === payload.id);
  if (!admin) {
    return res.status(401).json({ error: 'Session invalidated: Admin account not found.' });
  }

  const currentVersion = admin.tokenVersion || 1;
  const tokenVersion = payload.tokenVersion || 1;
  if (currentVersion !== tokenVersion) {
    return res.status(401).json({
      error: 'Session invalidated: Admin Key was updated. Please sign in with your new Admin Key.',
      sessionInvalidated: true
    });
  }

  if (admin.updatedAt && payload.updatedAt && admin.updatedAt !== payload.updatedAt) {
    return res.status(401).json({
      error: 'Session invalidated: Admin Key was updated. Please sign in with your new Admin Key.',
      sessionInvalidated: true
    });
  }

  req.adminUser = payload;
  next();
}
