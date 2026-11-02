import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { findUserByEmail, createUser, updatePassword, updateUser } from '../db/index.js';
import { asyncRoute } from '../middleware/errors.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { loginSchema, registerSchema } from '../middleware/schemas.js';
import { clearSession, hashPassword, safeUser, setSession, verifyPassword } from '../services/auth.js';

const router = Router();
const resetTokens = new Map<string, { userId: number; expiresAt: number }>();
router.post('/register', asyncRoute(async (req, res) => {
  const input = registerSchema.parse(req.body);
  if (await findUserByEmail(input.email)) return res.status(409).json({ message: 'An account with that email already exists' });
  const user = await createUser({ ...input, passwordHash: await hashPassword(input.password) });
  if (!user) return res.status(500).json({ message: 'Could not create account' });
  setSession(res, user); return res.status(201).json({ user: safeUser(user) });
}));
router.post('/login', asyncRoute(async (req, res) => {
  const input = loginSchema.parse(req.body); const user = await findUserByEmail(input.email);
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) return res.status(401).json({ message: 'Email or password is incorrect' });
  if (user.accountStatus === 'SUSPENDED') return res.status(403).json({ message: 'This account is suspended. Please contact campus support.' });
  if (req.body.role && req.body.role !== user.role.toLowerCase()) return res.status(403).json({ message: `This account is not registered as ${req.body.role}` });
  setSession(res, user); return res.json({ user: safeUser(user) });
}));
router.post('/logout', (_req, res) => { clearSession(res); res.json({ ok: true }); });
router.get('/me', requireAuth, (req: AuthRequest, res) => res.json({ user: safeUser(req.user!) }));
router.patch('/profile', requireAuth, asyncRoute(async (req: AuthRequest, res) => { const user = await updateUser(req.user!.id, req.body); res.json({ user: safeUser(user!) }); }));
router.post('/forgot-password', asyncRoute(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase();
  const user = await findUserByEmail(email);
  if (!user) return res.json({ message: 'If an account exists for that email, reset instructions are on the way.' });
  const token = randomBytes(24).toString('hex');
  resetTokens.set(token, { userId: user.id, expiresAt: Date.now() + 15 * 60 * 1000 });
  const payload: { message: string; resetToken?: string } = { message: 'If an account exists for that email, reset instructions are on the way.' };
  if (process.env.NODE_ENV !== 'production') payload.resetToken = token;
  res.json(payload);
}));
router.post('/reset-password', asyncRoute(async (req, res) => {
  const token = String(req.body.token || ''); const password = String(req.body.password || ''); const entry = resetTokens.get(token);
  if (!entry || entry.expiresAt < Date.now() || password.length < 8) return res.status(400).json({ message: 'Reset token is invalid or expired' });
  await updatePassword(entry.userId, await hashPassword(password)); resetTokens.delete(token); res.json({ message: 'Password reset successfully' });
}));
export default router;
