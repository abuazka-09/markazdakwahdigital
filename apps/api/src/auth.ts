import type { NextFunction, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { config } from "./config.js";

export const roles = [
  "SUPER_ADMIN",
  "DIREKTUR",
  "KEPALA_PENDIDIKAN",
  "GURU",
  "USTADZ_PEMBIMBING",
  "TIM_KESEHATAN",
  "BENDAHARA",
  "ORANG_TUA"
] as const;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export type Role = (typeof roles)[number];

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const secret = new TextEncoder().encode(config.jwtAccessSecret);

export async function signAccessToken(user: AuthUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid login payload" });
  }

  // Replace with PostgreSQL lookup + argon2 verification in production.
  const role: Role = parsed.data.email.includes("ortu") ? "ORANG_TUA" : "SUPER_ADMIN";
  const token = await signAccessToken({ id: "demo-user", email: parsed.data.email, role });
  return res.json({ accessToken: token, user: { email: parsed.data.email, role } });
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  try {
    const { payload } = await jwtVerify(header.slice(7), secret);
    req.user = {
      id: String(payload.id),
      email: String(payload.email),
      role: payload.role as Role
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  };
}
