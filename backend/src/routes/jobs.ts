import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticate, requireRole } from "../middleware/auth";

export const jobsRouter = Router();

jobsRouter.use(authenticate, requireRole("SystemAdmin", "OfficeStaff"));

const jobRequirementSchema = z.object({
  tradeRoleId: z.number(),
  requiredSlots: z.number().int().positive(),
});

const createJobSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  clientId: z.number(),
  materials: z.string().optional(),
  requirements: z.array(jobRequirementSchema).min(1),
});

const updateJobSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  clientId: z.number().optional(),
  materials: z.string().optional(),
  requirements: z.array(jobRequirementSchema).optional(),
});

jobsRouter.get("/", async (_req, res, next) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { deletedAt: null },
      include: {
        client: true,
        requirements: {
          include: {
            tradeRole: true,
          },
        },
        allocations: {
          where: { deletedAt: null },
          orderBy: { date: "asc" },
          take: 1,
          select: { date: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    
    // Transform to include firstAllocationDate
    const jobsWithStartDate = jobs.map((job) => ({
      ...job,
      firstAllocationDate: job.allocations[0]?.date || null,
      allocations: undefined, // Remove allocations array from response
    }));
    
    res.json(jobsWithStartDate);
  } catch (err) {
    next(err);
  }
});

jobsRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        client: true,
        requirements: {
          include: {
            tradeRole: true,
          },
        },
        allocations: {
          include: {
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
        },
      },
    });
    if (!job || job.deletedAt) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
  } catch (err) {
    next(err);
  }
});

jobsRouter.post("/", async (req, res, next) => {
  try {
    const parsed = createJobSchema.parse(req.body);
    const client = await prisma.client.findUnique({
      where: { id: parsed.clientId },
    });
    if (!client || client.deletedAt) {
      return res.status(400).json({ error: "Client not found" });
    }

    const job = await prisma.job.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        clientId: parsed.clientId,
        materials: parsed.materials,
        requirements: {
          create: parsed.requirements.map((req) => ({
            tradeRoleId: req.tradeRoleId,
            requiredSlots: req.requiredSlots,
          })),
        },
      },
      include: {
        client: true,
        requirements: {
          include: {
            tradeRole: true,
          },
        },
      },
    });
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
});

jobsRouter.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const parsed = updateJobSchema.parse(req.body);
    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (parsed.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: parsed.clientId },
      });
      if (!client || client.deletedAt) {
        return res.status(400).json({ error: "Client not found" });
      }
    }

    const updateData: any = {
      name: parsed.name,
      description: parsed.description,
      materials: parsed.materials,
    };
    if (parsed.clientId) {
      updateData.clientId = parsed.clientId;
    }

    if (parsed.requirements) {
      // Delete existing requirements and create new ones
      await prisma.jobRequirement.deleteMany({
        where: { jobId: id },
      });
      await prisma.jobRequirement.createMany({
        data: parsed.requirements.map((req) => ({
          jobId: id,
          tradeRoleId: req.tradeRoleId,
          requiredSlots: req.requiredSlots,
        })),
      });
    }

    const updated = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        requirements: {
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

jobsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return res.status(404).json({ error: "Job not found" });
    }
    const deleted = await prisma.job.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    res.json(deleted);
  } catch (err) {
    next(err);
  }
});



