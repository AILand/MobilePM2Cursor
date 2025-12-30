import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticate, requireRole } from "../middleware/auth";

export const clientsRouter = Router();

clientsRouter.use(authenticate, requireRole("SystemAdmin", "OfficeStaff"));

const clientSchema = z.object({
  name: z.string().min(1),
  contact: z.string().optional(),
  phone: z.string().optional(),
});

clientsRouter.get("/", async (_req, res, next) => {
  try {
    const clients = await prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
    res.json(clients);
  } catch (err) {
    next(err);
  }
});

clientsRouter.post("/", async (req, res, next) => {
  try {
    const parsed = clientSchema.parse(req.body);
    const client = await prisma.client.create({ data: parsed });
    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
});

clientsRouter.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const parsed = clientSchema.partial().parse(req.body);
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return res.status(404).json({ error: "Client not found" });
    }
    const updated = await prisma.client.update({
      where: { id },
      data: parsed,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

clientsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return res.status(404).json({ error: "Client not found" });
    }
    const deleted = await prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    res.json(deleted);
  } catch (err) {
    next(err);
  }
});


