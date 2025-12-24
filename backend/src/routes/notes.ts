import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticate, requireRole, getUserFromRequest } from "../middleware/auth";

export const notesRouter = Router();

notesRouter.use(authenticate);

const createNoteSchema = z.object({
  content: z.string().min(1),
  clientId: z.number().optional(),
  tradePersonId: z.number().optional(),
  allocationId: z.number().optional(),
});

// Get notes - filtered by permissions
notesRouter.get("/", async (req, res, next) => {
  try {
    const user = getUserFromRequest(req);
    const { clientId, tradePersonId, allocationId } = req.query;

    const where: any = {};

    if (clientId) {
      where.clientId = Number(clientId);
    }
    if (tradePersonId) {
      where.tradePersonId = Number(tradePersonId);
    }
    if (allocationId) {
      where.allocationId = Number(allocationId);
    }

    // TradePerson can only see notes for their own allocations
    if (user.role === "TradePerson") {
      const tradie = await prisma.tradePerson.findUnique({
        where: { userId: user.id },
      });
      if (tradie) {
        if (where.tradePersonId && where.tradePersonId !== tradie.id) {
          return res.status(403).json({ error: "Access denied" });
        }
        if (where.allocationId) {
          const allocation = await prisma.allocation.findUnique({
            where: { id: where.allocationId },
          });
          if (!allocation || allocation.tradePersonId !== tradie.id) {
            return res.status(403).json({ error: "Access denied" });
          }
        }
        // If no filters, only show notes for their allocations
        if (!where.allocationId && !where.tradePersonId) {
          const myAllocations = await prisma.allocation.findMany({
            where: { tradePersonId: tradie.id },
            select: { id: true },
          });
          where.allocationId = {
            in: myAllocations.map((a) => a.id),
          };
        }
      } else {
        return res.json([]);
      }
    }

    const notes = await prisma.note.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: true,
        tradePerson: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        allocation: {
          include: {
            job: {
              include: {
                client: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(notes);
  } catch (err) {
    next(err);
  }
});

notesRouter.post("/", async (req, res, next) => {
  try {
    const user = getUserFromRequest(req);
    const parsed = createNoteSchema.parse(req.body);

    // TradePerson can only add notes to their own allocations
    if (user.role === "TradePerson") {
      if (parsed.allocationId) {
        const tradie = await prisma.tradePerson.findUnique({
          where: { userId: user.id },
        });
        if (tradie) {
          const allocation = await prisma.allocation.findUnique({
            where: { id: parsed.allocationId },
          });
          if (!allocation || allocation.tradePersonId !== tradie.id) {
            return res.status(403).json({ error: "Can only add notes to your own allocations" });
          }
        } else {
          return res.status(403).json({ error: "TradePerson record not found" });
        }
      } else {
        return res.status(403).json({ error: "TradePerson can only add notes to allocations" });
      }
    }

    const note = await prisma.note.create({
      data: {
        content: parsed.content,
        authorId: user.id,
        clientId: parsed.clientId,
        tradePersonId: parsed.tradePersonId,
        allocationId: parsed.allocationId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: true,
        tradePerson: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        allocation: {
          include: {
            job: {
              include: {
                client: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
});



