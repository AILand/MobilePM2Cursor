import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticate, requireRole, getUserFromRequest } from "../middleware/auth";

export const scheduleRouter = Router();

scheduleRouter.use(authenticate);

const createAllocationSchema = z.object({
  jobId: z.number(),
  tradePersonId: z.number(),
  date: z.string().transform((str) => new Date(str)),
  period: z.enum(["AM", "PM"]),
});

const getScheduleQuerySchema = z.object({
  weekStart: z.string().optional().transform((str) => str ? new Date(str) : undefined),
});

// Get weekly grid view - all employees and their allocations
scheduleRouter.get("/grid", requireRole("SystemAdmin", "OfficeStaff"), async (req, res, next) => {
  try {
    const query = getScheduleQuerySchema.parse(req.query);
    const weekStart = query.weekStart || getWeekStart(new Date());

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const tradies = await prisma.tradePerson.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        roles: {
          include: {
            tradeRole: true,
          },
        },
        allocations: {
          where: {
            date: {
              gte: weekStart,
              lt: weekEnd,
            },
            deletedAt: null,
          },
          include: {
            job: {
              include: {
                client: true,
              },
            },
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    res.json({
      weekStart: weekStart.toISOString(),
      tradies,
    });
  } catch (err) {
    next(err);
  }
});

// Get Gantt view for a specific tradie
scheduleRouter.get("/gantt/:tradePersonId", async (req, res, next) => {
  try {
    const tradePersonId = Number(req.params.tradePersonId);
    const user = getUserFromRequest(req);
    const query = getScheduleQuerySchema.parse(req.query);
    const weekStart = query.weekStart || getWeekStart(new Date());

    // TradePerson can only view their own schedule
    if (user.role === "TradePerson") {
      const tradie = await prisma.tradePerson.findUnique({
        where: { userId: user.id },
      });
      if (!tradie || tradie.id !== tradePersonId) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const allocations = await prisma.allocation.findMany({
      where: {
        tradePersonId,
        date: {
          gte: weekStart,
          lt: weekEnd,
        },
        deletedAt: null,
      },
      include: {
        job: {
          include: {
            client: true,
          },
        },
      },
      orderBy: [
        { date: "asc" },
        { period: "asc" },
      ],
    });

    res.json({
      weekStart: weekStart.toISOString(),
      allocations,
    });
  } catch (err) {
    next(err);
  }
});

// Get current user's schedule (for TradePerson)
scheduleRouter.get("/my-schedule", async (req, res, next) => {
  try {
    const user = getUserFromRequest(req);
    if (user.role !== "TradePerson") {
      return res.status(403).json({ error: "Only TradePerson can access this endpoint" });
    }

    const tradie = await prisma.tradePerson.findUnique({
      where: { userId: user.id },
    });
    if (!tradie) {
      return res.status(404).json({ error: "TradePerson record not found" });
    }

    const query = getScheduleQuerySchema.parse(req.query);
    const weekStart = query.weekStart || getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const allocations = await prisma.allocation.findMany({
      where: {
        tradePersonId: tradie.id,
        date: {
          gte: weekStart,
          lt: weekEnd,
        },
        deletedAt: null,
      },
      include: {
        job: {
          include: {
            client: true,
          },
        },
      },
      orderBy: [
        { date: "asc" },
        { period: "asc" },
      ],
    });

    res.json({
      weekStart: weekStart.toISOString(),
      allocations,
    });
  } catch (err) {
    next(err);
  }
});

// Create allocation (only SystemAdmin and OfficeStaff)
scheduleRouter.post("/", requireRole("SystemAdmin", "OfficeStaff"), async (req, res, next) => {
  try {
    const parsed = createAllocationSchema.parse(req.body);

    // Check for double-booking
    const existing = await prisma.allocation.findUnique({
      where: {
        allocation_unique_per_tradie_period: {
          tradePersonId: parsed.tradePersonId,
          date: parsed.date,
          period: parsed.period,
        },
      },
    });

    if (existing && !existing.deletedAt) {
      return res.status(400).json({ error: "TradePerson already allocated for this period" });
    }

    // If soft-deleted, restore it
    if (existing && existing.deletedAt) {
      const restored = await prisma.allocation.update({
        where: { id: existing.id },
        data: {
          jobId: parsed.jobId,
          deletedAt: null,
        },
        include: {
          job: {
            include: {
              client: true,
            },
          },
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
        },
      });
      return res.json(restored);
    }

    const allocation = await prisma.allocation.create({
      data: parsed,
      include: {
        job: {
          include: {
            client: true,
          },
        },
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
      },
    });
    res.status(201).json(allocation);
  } catch (err) {
    next(err);
  }
});

// Delete allocation (soft delete)
scheduleRouter.delete("/:id", requireRole("SystemAdmin", "OfficeStaff"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.allocation.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return res.status(404).json({ error: "Allocation not found" });
    }
    const deleted = await prisma.allocation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    res.json(deleted);
  } catch (err) {
    next(err);
  }
});

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

