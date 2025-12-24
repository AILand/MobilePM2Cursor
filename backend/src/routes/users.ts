import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticate, requireRole, UserRole } from "../middleware/auth";

export const usersRouter = Router();

const baseUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["SystemAdmin", "OfficeStaff", "TradePerson"]),
});

const createUserSchema = baseUserSchema.extend({
  password: z.string().min(4),
});

const updateUserSchema = baseUserSchema.partial().extend({
  password: z.string().min(4).optional(),
});

usersRouter.use(authenticate);

// List users (excluding soft-deleted)
usersRouter.get(
  "/",
  requireRole("SystemAdmin", "OfficeStaff"),
  async (_req, res, next) => {
    try {
      const users = await prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { name: "asc" },
      });
      res.json(users);
    } catch (err) {
      next(err);
    }
  },
);

// Create user
usersRouter.post(
  "/",
  requireRole("SystemAdmin", "OfficeStaff"),
  async (req, res, next) => {
    try {
      const parsed = createUserSchema.parse(req.body);

      // OfficeStaff cannot create SystemAdmin
      if (req.user?.role === "OfficeStaff" && parsed.role === "SystemAdmin") {
        return res.status(403).json({ error: "Cannot create SystemAdmin" });
      }

      const passwordHash = await bcrypt.hash(parsed.password, 10);
      const user = await prisma.user.create({
        data: {
          email: parsed.email,
          name: parsed.name,
          role: parsed.role as UserRole,
          passwordHash,
        },
      });
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  },
);

// Update user
usersRouter.put(
  "/:id",
  requireRole("SystemAdmin", "OfficeStaff"),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const parsed = updateUserSchema.parse(req.body);

      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing || existing.deletedAt) {
        return res.status(404).json({ error: "User not found" });
      }

      if (req.user?.role === "OfficeStaff") {
        // OfficeStaff cannot modify SystemAdmin
        if (
          existing.role === "SystemAdmin" ||
          parsed.role === "SystemAdmin"
        ) {
          return res.status(403).json({ error: "Cannot manage SystemAdmin" });
        }
      }

      const data: any = { ...parsed };
      if (parsed.password) {
        data.passwordHash = await bcrypt.hash(parsed.password, 10);
        delete data.password;
      }

      const updated = await prisma.user.update({
        where: { id },
        data,
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

// Soft delete user
usersRouter.delete(
  "/:id",
  requireRole("SystemAdmin", "OfficeStaff"),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing || existing.deletedAt) {
        return res.status(404).json({ error: "User not found" });
      }

      if (req.user?.role === "OfficeStaff" && existing.role === "SystemAdmin") {
        return res.status(403).json({ error: "Cannot delete SystemAdmin" });
      }

      const deleted = await prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      res.json(deleted);
    } catch (err) {
      next(err);
    }
  },
);


