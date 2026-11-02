import bcrypt from 'bcryptjs';
import type { Response } from 'express';
import type { User } from '../types.js';
import { signToken } from '../middleware/auth.js';
export async function hashPassword(password: string) { return bcrypt.hash(password, 12); }
export async function verifyPassword(password: string, hash: string) { return bcrypt.compare(password, hash); }
function crossSitePreview() { return Boolean(process.env.MANUS_PROJECT_ID) || process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production'; }
export function setSession(res: Response, user: User) { const secure = crossSitePreview(); res.cookie('webdev_app_session', signToken(user), { httpOnly: true, secure, sameSite: secure ? 'none' : 'lax', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' }); }
export function clearSession(res: Response) { const secure = crossSitePreview(); res.clearCookie('webdev_app_session', { httpOnly: true, secure, sameSite: secure ? 'none' : 'lax', path: '/' }); }
export function safeUser(user: User) { return { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, studentId: user.studentId, profileImage: user.profileImage, accountStatus: user.accountStatus, createdAt: user.createdAt }; }
