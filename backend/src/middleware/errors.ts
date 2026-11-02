import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
export const notFound: RequestHandler = (_req, res) => res.status(404).json({ message: 'Route not found' });
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) return res.status(400).json({ message: 'Please check the form fields', issues: error.issues });
  console.error(error);
  return res.status(500).json({ message: error instanceof Error ? error.message : 'Unexpected server error' });
};
export function asyncRoute<T extends (...args: any[]) => Promise<any>>(handler: T) { return (req: any, res: any, next: any) => Promise.resolve(handler(req, res, next)).catch(next); }
