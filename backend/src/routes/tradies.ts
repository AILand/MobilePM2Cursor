import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticate, requireRole } from "../middleware/auth";

export const tradiesRouter = Router();

tradiesRouter.use(authenticate, requireRole("SystemAdmin", "OfficeStaff"));

const createTradieSchema = z.object({
  userId: z.number(),
  tradeRoleIds: z.array(z.number()).min(1),
});

const updateTradieSchema = z.object({
  tradeRoleIds: z.array(z.number()).min(1).optional(),
});

tradiesRouter.get("/", async (_req, res, next) => {
  try {
    const tradies = await prisma.tradePerson.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        roles: {
          include: {
            tradeRole: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });
    res.json(tradies);
  } catch (err) {
    next(err);
  }
});

tradiesRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const tradie = await prisma.tradePerson.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        roles: {
          include: {
            tradeRole: true,
          },
        },
      },
    });
    if (!tradie || tradie.deletedAt) {
      return res.status(404).json({ error: "TradePerson not found" });
    }
    res.json(tradie);
  } catch (err) {
    next(err);
  }
});

tradiesRouter.post("/", async (req, res, next) => {
  try {
    const parsed = createTradieSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { id: parsed.userId },
    });
    if (!user || user.deletedAt || user.role !== "TradePerson") {
      return res.status(400).json({ error: "Invalid user or not a TradePerson" });
    }

    const existingTradie = await prisma.tradePerson.findUnique({
      where: { userId: parsed.userId },
    });
    if (existingTradie) {
      return res.status(400).json({ error: "User already has a TradePerson record" });
    }

    const tradie = await prisma.tradePerson.create({
      data: {
        userId: parsed.userId,
        roles: {
          create: parsed.tradeRoleIds.map((roleId) => ({
            tradeRoleId: roleId,
          })),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        roles: {
          include: {
            tradeRole: true,
          },
        },
      },
    });
    res.status(201).json(tradie);
  } catch (err) {
    next(err);
  }
});

tradiesRouter.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const parsed = updateTradieSchema.parse(req.body);
    const existing = await prisma.tradePerson.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return res.status(404).json({ error: "TradePerson not found" });
    }

    if (parsed.tradeRoleIds) {
      // Delete existing roles and create new ones
      await prisma.tradePersonRole.deleteMany({
        where: { tradePersonId: id },
      });
      await prisma.tradePersonRole.createMany({
        data: parsed.tradeRoleIds.map((roleId) => ({
          tradePersonId: id,
          tradeRoleId: roleId,
        })),
      });
    }

    const updated = await prisma.tradePerson.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        roles: {
          include: {
            tradeRole: true,
          },
        },
      },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

tradiesRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.tradePerson.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return res.status(404).json({ error: "TradePerson not found" });
    }
    const deleted = await prisma.tradePerson.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    res.json(deleted);
  } catch (err) {
    next(err);
  }
});

tradiesRouter.get("/roles/list", async (_req, res, next) => {
  try {
    const roles = await prisma.tradeRole.findMany({
      orderBy: { name: "asc" },
    });
    res.json(roles);
  } catch (err) {
    next(err);
  }
});



