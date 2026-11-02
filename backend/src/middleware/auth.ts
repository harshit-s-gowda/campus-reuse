import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { findUserById } from '../db/index.js';
import type { Role, User } from '../types.js';

export interface AuthRequest extends Request { user?: User; }
function secret() { return process.env.JWT_SECRET || 'development-only-change-me'; }
export function signToken(user: User) { return jwt.sign({ sub: user.id, role: user.role }, secret(), { expiresIn: '7d' }); }
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.webdev_app_session;
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    const payload = jwt.verify(token, secret()) as jwt.JwtPayload;
    const user = await findUserById(Number(payload.sub));
    if (!user || user.accountStatus === 'SUSPENDED') return res.status(401).json({ message: 'Account is unavailable' });
    req.user = user; next();
  } catch { return res.status(401).json({ message: 'Invalid or expired session' }); }
}
export function requireRole(...roles: Role[]) { return (req: AuthRequest, res: Response, next: NextFunction) => { if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: 'You do not have permission for this action' }); next(); }; }
