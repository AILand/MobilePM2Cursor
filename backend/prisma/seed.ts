import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create trade roles
  const plumber = await prisma.tradeRole.upsert({
    where: { name: "Plumber" },
    update: {},
    create: { name: "Plumber" },
  });

  const tiler = await prisma.tradeRole.upsert({
    where: { name: "Tiler" },
    update: {},
    create: { name: "Tiler" },
  });

  const carpenter = await prisma.tradeRole.upsert({
    where: { name: "Carpenter" },
    update: {},
    create: { name: "Carpenter" },
  });

  const electrician = await prisma.tradeRole.upsert({
    where: { name: "Electrician" },
    update: {},
    create: { name: "Electrician" },
  });

  console.log("Created trade roles");

  // Hash password for all users (password: "password123")
  const passwordHash = await bcrypt.hash("password123", 10);

  // Create SystemAdmin
  const admin = await prisma.user.upsert({
    where: { email: "admin@tradiedr.com" },
    update: {},
    create: {
      email: "admin@tradiedr.com",
      name: "System Administrator",
      passwordHash,
      role: "SystemAdmin",
    },
  });

  // Create OfficeStaff
  const officeStaff = await prisma.user.upsert({
    where: { email: "office@tradiedr.com" },
    update: {},
    create: {
      email: "office@tradiedr.com",
      name: "Office Staff",
      passwordHash,
      role: "OfficeStaff",
    },
  });

  // Create TradePeople
  const tradie1 = await prisma.user.upsert({
    where: { email: "john.plumber@tradiedr.com" },
    update: {},
    create: {
      email: "john.plumber@tradiedr.com",
      name: "John Smith",
      passwordHash,
      role: "TradePerson",
    },
  });

  const tradie2 = await prisma.user.upsert({
    where: { email: "sarah.tiler@tradiedr.com" },
    update: {},
    create: {
      email: "sarah.tiler@tradiedr.com",
      name: "Sarah Johnson",
      passwordHash,
      role: "TradePerson",
    },
  });

  const tradie3 = await prisma.user.upsert({
    where: { email: "mike.carpenter@tradiedr.com" },
    update: {},
    create: {
      email: "mike.carpenter@tradiedr.com",
      name: "Mike Brown",
      passwordHash,
      role: "TradePerson",
    },
  });

  const tradie4 = await prisma.user.upsert({
    where: { email: "lisa.electrician@tradiedr.com" },
    update: {},
    create: {
      email: "lisa.electrician@tradiedr.com",
      name: "Lisa Williams",
      passwordHash,
      role: "TradePerson",
    },
  });

  const tradie5 = await prisma.user.upsert({
    where: { email: "david.plumber@tradiedr.com" },
    update: {},
    create: {
      email: "david.plumber@tradiedr.com",
      name: "David Chen",
      passwordHash,
      role: "TradePerson",
    },
  });

  const tradie6 = await prisma.user.upsert({
    where: { email: "emma.tiler@tradiedr.com" },
    update: {},
    create: {
      email: "emma.tiler@tradiedr.com",
      name: "Emma Davis",
      passwordHash,
      role: "TradePerson",
    },
  });

  const tradie7 = await prisma.user.upsert({
    where: { email: "james.carpenter@tradiedr.com" },
    update: {},
    create: {
      email: "james.carpenter@tradiedr.com",
      name: "James Wilson",
      passwordHash,
      role: "TradePerson",
    },
  });

  const tradie8 = await prisma.user.upsert({
    where: { email: "sophia.electrician@tradiedr.com" },
    update: {},
    create: {
      email: "sophia.electrician@tradiedr.com",
      name: "Sophia Martinez",
      passwordHash,
      role: "TradePerson",
    },
  });

  console.log("Created users");

  // Create TradePerson records
  const tradePerson1 = await prisma.tradePerson.upsert({
    where: { userId: tradie1.id },
    update: {},
    create: {
      userId: tradie1.id,
      roles: {
        create: [{ tradeRoleId: plumber.id }],
      },
    },
  });

  const tradePerson2 = await prisma.tradePerson.upsert({
    where: { userId: tradie2.id },
    update: {},
    create: {
      userId: tradie2.id,
      roles: {
        create: [{ tradeRoleId: tiler.id }],
      },
    },
  });

  const tradePerson3 = await prisma.tradePerson.upsert({
    where: { userId: tradie3.id },
    update: {},
    create: {
      userId: tradie3.id,
      roles: {
        create: [{ tradeRoleId: carpenter.id }],
      },
    },
  });

  const tradePerson4 = await prisma.tradePerson.upsert({
    where: { userId: tradie4.id },
    update: {},
    create: {
      userId: tradie4.id,
      roles: {
        create: [{ tradeRoleId: electrician.id }],
      },
    },
  });

  const tradePerson5 = await prisma.tradePerson.upsert({
    where: { userId: tradie5.id },
    update: {},
    create: {
      userId: tradie5.id,
      roles: {
        create: [{ tradeRoleId: plumber.id }],
      },
    },
  });

  const tradePerson6 = await prisma.tradePerson.upsert({
    where: { userId: tradie6.id },
    update: {},
    create: {
      userId: tradie6.id,
      roles: {
        create: [{ tradeRoleId: tiler.id }],
      },
    },
  });

  const tradePerson7 = await prisma.tradePerson.upsert({
    where: { userId: tradie7.id },
    update: {},
    create: {
      userId: tradie7.id,
      roles: {
        create: [{ tradeRoleId: carpenter.id }],
      },
    },
  });

  const tradePerson8 = await prisma.tradePerson.upsert({
    where: { userId: tradie8.id },
    update: {},
    create: {
      userId: tradie8.id,
      roles: {
        create: [{ tradeRoleId: electrician.id }],
      },
    },
  });

  console.log("Created trade persons");

  // Create Clients
  const client1 = await prisma.client.create({
    data: {
      name: "ABC Renovations Ltd",
      contact: "contact@abcrenovations.com",
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: "Home Sweet Home",
      contact: "info@homesweethome.com",
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: "Modern Living Co",
      contact: "hello@modernliving.com",
    },
  });

  const client4 = await prisma.client.create({
    data: {
      name: "Elite Properties",
      contact: "info@eliteproperties.com",
    },
  });

  const client5 = await prisma.client.create({
    data: {
      name: "Dream Homes Inc",
      contact: "contact@dreamhomes.com",
    },
  });

  const client6 = await prisma.client.create({
    data: {
      name: "Premium Builders",
      contact: "hello@premiumbuilders.com",
    },
  });

  console.log("Created clients");

  // Create Jobs
  const job1 = await prisma.job.create({
    data: {
      name: "Bathroom Renovation - Main Suite",
      description: "Complete bathroom renovation including plumbing, tiling, and carpentry",
      clientId: client1.id,
      materials: "Tiles, fixtures, vanity, mirror",
      requirements: {
        create: [
          { tradeRoleId: plumber.id, requiredSlots: 4 },
          { tradeRoleId: tiler.id, requiredSlots: 6 },
          { tradeRoleId: carpenter.id, requiredSlots: 2 },
        ],
      },
    },
  });

  const job2 = await prisma.job.create({
    data: {
      name: "Kitchen Upgrade",
      description: "Kitchen plumbing and electrical work",
      clientId: client2.id,
      materials: "Sink, taps, electrical outlets",
      requirements: {
        create: [
          { tradeRoleId: plumber.id, requiredSlots: 2 },
          { tradeRoleId: electrician.id, requiredSlots: 3 },
        ],
      },
    },
  });

  const job3 = await prisma.job.create({
    data: {
      name: "Ensuite Bathroom",
      description: "New ensuite bathroom installation",
      clientId: client3.id,
      materials: "Toilet, shower, tiles, vanity",
      requirements: {
        create: [
          { tradeRoleId: plumber.id, requiredSlots: 3 },
          { tradeRoleId: tiler.id, requiredSlots: 4 },
        ],
      },
    },
  });

  const job4 = await prisma.job.create({
    data: {
      name: "Master Bathroom Renovation",
      description: "Full master bathroom renovation with premium fixtures",
      clientId: client4.id,
      materials: "Premium tiles, fixtures, heated floors, custom vanity",
      requirements: {
        create: [
          { tradeRoleId: plumber.id, requiredSlots: 5 },
          { tradeRoleId: tiler.id, requiredSlots: 8 },
          { tradeRoleId: electrician.id, requiredSlots: 2 },
        ],
      },
    },
  });

  const job5 = await prisma.job.create({
    data: {
      name: "Guest Bathroom Remodel",
      description: "Complete guest bathroom remodel",
      clientId: client1.id,
      materials: "Tiles, fixtures, vanity, lighting",
      requirements: {
        create: [
          { tradeRoleId: plumber.id, requiredSlots: 3 },
          { tradeRoleId: tiler.id, requiredSlots: 5 },
          { tradeRoleId: carpenter.id, requiredSlots: 1 },
        ],
      },
    },
  });

  const job6 = await prisma.job.create({
    data: {
      name: "Kitchen & Bathroom Combo",
      description: "Simultaneous kitchen and bathroom renovation",
      clientId: client5.id,
      materials: "Kitchen fixtures, bathroom tiles, plumbing, electrical",
      requirements: {
        create: [
          { tradeRoleId: plumber.id, requiredSlots: 6 },
          { tradeRoleId: tiler.id, requiredSlots: 4 },
          { tradeRoleId: electrician.id, requiredSlots: 4 },
          { tradeRoleId: carpenter.id, requiredSlots: 3 },
        ],
      },
    },
  });

  const job7 = await prisma.job.create({
    data: {
      name: "Luxury Spa Bathroom",
      description: "High-end spa-style bathroom installation",
      clientId: client6.id,
      materials: "Premium materials, spa fixtures, custom cabinetry",
      requirements: {
        create: [
          { tradeRoleId: plumber.id, requiredSlots: 6 },
          { tradeRoleId: tiler.id, requiredSlots: 10 },
          { tradeRoleId: electrician.id, requiredSlots: 3 },
          { tradeRoleId: carpenter.id, requiredSlots: 4 },
        ],
      },
    },
  });

  const job8 = await prisma.job.create({
    data: {
      name: "Powder Room Update",
      description: "Small powder room update and refresh",
      clientId: client2.id,
      materials: "New fixtures, paint, mirror",
      requirements: {
        create: [
          { tradeRoleId: plumber.id, requiredSlots: 1 },
          { tradeRoleId: tiler.id, requiredSlots: 2 },
        ],
      },
    },
  });

  const job9 = await prisma.job.create({
    data: {
      name: "Family Bathroom Overhaul",
      description: "Complete family bathroom overhaul",
      clientId: client3.id,
      materials: "Durable tiles, family-friendly fixtures, storage",
      requirements: {
        create: [
          { tradeRoleId: plumber.id, requiredSlots: 4 },
          { tradeRoleId: tiler.id, requiredSlots: 6 },
          { tradeRoleId: carpenter.id, requiredSlots: 2 },
        ],
      },
    },
  });

  const job10 = await prisma.job.create({
    data: {
      name: "Commercial Bathroom Refit",
      description: "Commercial bathroom refit for office building",
      clientId: client4.id,
      materials: "Commercial-grade fixtures, durable materials",
      requirements: {
        create: [
          { tradeRoleId: plumber.id, requiredSlots: 8 },
          { tradeRoleId: tiler.id, requiredSlots: 12 },
          { tradeRoleId: electrician.id, requiredSlots: 4 },
        ],
      },
    },
  });

  console.log("Created jobs");

  // Clear existing allocations to avoid unique constraint errors
  await prisma.allocation.deleteMany({});

  // Create some allocations for this week
  const today = new Date();
  const monday = new Date(today);
  const day = monday.getDay();
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);

  // Helper function to create a normalized date (UTC midnight)
  const createDate = (date: Date): Date => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  };

  // Monday AM - John (Plumber) on Job 1
  await prisma.allocation.create({
    data: {
      jobId: job1.id,
      tradePersonId: tradePerson1.id,
      date: createDate(monday),
      period: "AM",
    },
  });

  // Monday PM - John (Plumber) on Job 1
  await prisma.allocation.create({
    data: {
      jobId: job1.id,
      tradePersonId: tradePerson1.id,
      date: createDate(monday),
      period: "PM",
    },
  });

  // Tuesday AM - Sarah (Tiler) on Job 1
  const tuesday = new Date(monday);
  tuesday.setDate(tuesday.getDate() + 1);
  await prisma.allocation.create({
    data: {
      jobId: job1.id,
      tradePersonId: tradePerson2.id,
      date: createDate(tuesday),
      period: "AM",
    },
  });

  // Tuesday PM - Sarah (Tiler) on Job 1
  await prisma.allocation.create({
    data: {
      jobId: job1.id,
      tradePersonId: tradePerson2.id,
      date: createDate(tuesday),
      period: "PM",
    },
  });

  // Wednesday AM - Mike (Carpenter) on Job 1
  const wednesday = new Date(monday);
  wednesday.setDate(wednesday.getDate() + 2);
  await prisma.allocation.create({
    data: {
      jobId: job1.id,
      tradePersonId: tradePerson3.id,
      date: createDate(wednesday),
      period: "AM",
    },
  });

  // Thursday AM - John (Plumber) on Job 2
  const thursday = new Date(monday);
  thursday.setDate(thursday.getDate() + 3);
  await prisma.allocation.create({
    data: {
      jobId: job2.id,
      tradePersonId: tradePerson1.id,
      date: createDate(thursday),
      period: "AM",
    },
  });

  // Thursday PM - Lisa (Electrician) on Job 2
  await prisma.allocation.create({
    data: {
      jobId: job2.id,
      tradePersonId: tradePerson4.id,
      date: createDate(thursday),
      period: "PM",
    },
  });

  // Friday AM - Sarah (Tiler) on Job 3
  const friday = new Date(monday);
  friday.setDate(friday.getDate() + 4);
  await prisma.allocation.create({
    data: {
      jobId: job3.id,
      tradePersonId: tradePerson2.id,
      date: createDate(friday),
      period: "AM",
    },
  });

  // Additional allocations for more jobs
  // Monday AM - David (Plumber) on Job 4
  await prisma.allocation.create({
    data: {
      jobId: job4.id,
      tradePersonId: tradePerson5.id,
      date: createDate(monday),
      period: "AM",
    },
  });

  // Monday PM - Emma (Tiler) on Job 4
  await prisma.allocation.create({
    data: {
      jobId: job4.id,
      tradePersonId: tradePerson6.id,
      date: createDate(monday),
      period: "PM",
    },
  });

  // Tuesday AM - David (Plumber) on Job 4
  await prisma.allocation.create({
    data: {
      jobId: job4.id,
      tradePersonId: tradePerson5.id,
      date: createDate(tuesday),
      period: "AM",
    },
  });

  // Tuesday PM - Emma (Tiler) on Job 4
  await prisma.allocation.create({
    data: {
      jobId: job4.id,
      tradePersonId: tradePerson6.id,
      date: createDate(tuesday),
      period: "PM",
    },
  });

  // Wednesday AM - John (Plumber) on Job 5
  await prisma.allocation.create({
    data: {
      jobId: job5.id,
      tradePersonId: tradePerson1.id,
      date: createDate(wednesday),
      period: "AM",
    },
  });

  // Wednesday PM - Sarah (Tiler) on Job 5
  await prisma.allocation.create({
    data: {
      jobId: job5.id,
      tradePersonId: tradePerson2.id,
      date: createDate(wednesday),
      period: "PM",
    },
  });

  // Thursday AM - David (Plumber) on Job 6
  await prisma.allocation.create({
    data: {
      jobId: job6.id,
      tradePersonId: tradePerson5.id,
      date: createDate(thursday),
      period: "AM",
    },
  });

  // Thursday PM - Sophia (Electrician) on Job 6
  await prisma.allocation.create({
    data: {
      jobId: job6.id,
      tradePersonId: tradePerson8.id,
      date: createDate(thursday),
      period: "PM",
    },
  });

  // Friday AM - James (Carpenter) on Job 6
  await prisma.allocation.create({
    data: {
      jobId: job6.id,
      tradePersonId: tradePerson7.id,
      date: createDate(friday),
      period: "AM",
    },
  });

  // Friday PM - Sophia (Electrician) on Job 7
  await prisma.allocation.create({
    data: {
      jobId: job7.id,
      tradePersonId: tradePerson8.id,
      date: createDate(friday),
      period: "PM",
    },
  });

  // Monday AM - Emma (Tiler) on Job 7
  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  await prisma.allocation.create({
    data: {
      jobId: job7.id,
      tradePersonId: tradePerson6.id,
      date: createDate(nextMonday),
      period: "AM",
    },
  });

  // Monday PM - David (Plumber) on Job 8
  await prisma.allocation.create({
    data: {
      jobId: job8.id,
      tradePersonId: tradePerson5.id,
      date: createDate(monday),
      period: "PM",
    },
  });

  // Tuesday AM - Emma (Tiler) on Job 8
  await prisma.allocation.create({
    data: {
      jobId: job8.id,
      tradePersonId: tradePerson6.id,
      date: createDate(tuesday),
      period: "AM",
    },
  });

  // Tuesday PM - Mike (Carpenter) on Job 9
  await prisma.allocation.create({
    data: {
      jobId: job9.id,
      tradePersonId: tradePerson3.id,
      date: createDate(tuesday),
      period: "PM",
    },
  });

  // Wednesday AM - David (Plumber) on Job 9
  await prisma.allocation.create({
    data: {
      jobId: job9.id,
      tradePersonId: tradePerson5.id,
      date: createDate(wednesday),
      period: "AM",
    },
  });

  // Wednesday PM - Emma (Tiler) on Job 9
  await prisma.allocation.create({
    data: {
      jobId: job9.id,
      tradePersonId: tradePerson6.id,
      date: createDate(wednesday),
      period: "PM",
    },
  });

  // Next Monday PM - John (Plumber) on Job 10
  await prisma.allocation.create({
    data: {
      jobId: job10.id,
      tradePersonId: tradePerson1.id,
      date: createDate(nextMonday),
      period: "PM",
    },
  });

  // Thursday PM - Sarah (Tiler) on Job 10
  await prisma.allocation.create({
    data: {
      jobId: job10.id,
      tradePersonId: tradePerson2.id,
      date: createDate(thursday),
      period: "PM",
    },
  });

  // Friday AM - Emma (Tiler) on Job 10
  await prisma.allocation.create({
    data: {
      jobId: job10.id,
      tradePersonId: tradePerson6.id,
      date: createDate(friday),
      period: "AM",
    },
  });

  // Friday PM - Lisa (Electrician) on Job 10
  await prisma.allocation.create({
    data: {
      jobId: job10.id,
      tradePersonId: tradePerson4.id,
      date: createDate(friday),
      period: "PM",
    },
  });

  console.log("Created allocations");

  // Create some notes
  await prisma.note.create({
    data: {
      content: "Client requested early start time",
      authorId: officeStaff.id,
      clientId: client1.id,
    },
  });

  await prisma.note.create({
    data: {
      content: "Materials delivered on site",
      authorId: tradePerson1.id,
      allocationId: (await prisma.allocation.findFirst({
        where: { tradePersonId: tradePerson1.id },
      }))!.id,
    },
  });

  console.log("Created notes");

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



