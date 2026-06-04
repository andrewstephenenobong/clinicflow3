// ============================================================================
// ClinicFlow Seed Script
// Populates the database with realistic test data for development.
// Run with: npx tsx prisma/seed.ts
// ============================================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding ClinicFlow database...\n");

  // ─────────────────────────────────────────────────────────────────────────
  // 1. WIPE — delete in reverse dependency order so foreign keys don't complain
  // ─────────────────────────────────────────────────────────────────────────
  console.log("🧹 Wiping existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.device.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clinic.deleteMany();
  console.log("   ✓ Database wiped\n");

  // ─────────────────────────────────────────────────────────────────────────
  // 2. CLINIC — the tenant everything else belongs to
  // ─────────────────────────────────────────────────────────────────────────
  console.log("🏥 Creating clinic...");
  const clinic = await prisma.clinic.create({
    data: {
      name: "Demo Clinic",
      address: "12 Awolowo Road, Ikoyi, Lagos",
      phone: "+234 803 000 0000",
      email: "info@democlinic.ng",
      plan: "STARTER",
      subscriptionStatus: "active",
      securityContactPhone: "+234 803 111 1111",
    },
  });
  console.log(`   ✓ Clinic: ${clinic.name} (${clinic.id})\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // 3. USERS — staff who log in. Real bcrypt-hashed passwords so login works.
  // ─────────────────────────────────────────────────────────────────────────
  console.log("👥 Creating users...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      name: "Dr. Adaeze Okafor",
      email: "admin@democlinic.ng",
      passwordHash: hashedPassword,
      role: "ADMIN",
    },
  });
  const doctor = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      name: "Dr. Tunde Bakare",
      email: "doctor@democlinic.ng",
      passwordHash: hashedPassword,
      role: "DOCTOR",
    },
  });
  const receptionist = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      name: "Funmi Adesanya",
      email: "reception@democlinic.ng",
      passwordHash: hashedPassword,
      role: "RECEPTIONIST",
    },
  });
  console.log(`   ✓ Admin: ${admin.name}`);
  console.log(`   ✓ Doctor: ${doctor.name}`);
  console.log(`   ✓ Receptionist: ${receptionist.name}`);
  console.log(`   (all passwords: "password123" — dev only!)\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // 4. PATIENTS — realistic Nigerian names
  // ─────────────────────────────────────────────────────────────────────────
  console.log("🧑‍⚕️ Creating patients...");
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        clinicId: clinic.id,
        name: "Chukwuemeka Eze",
        age: 34,
        gender: "M",
        phone: "+234 803 222 0001",
        address: "5 Ozumba Mbadiwe, Victoria Island",
        nextOfKin: "Ngozi Eze (wife) — +234 803 222 0002",
        bloodGroup: "O+",
        allergies: "Penicillin",
        chronicConditions: "Hypertension",
      },
    }),
    prisma.patient.create({
      data: {
        clinicId: clinic.id,
        name: "Aisha Bello",
        age: 28,
        gender: "F",
        phone: "+234 803 222 0003",
        bloodGroup: "A+",
      },
    }),
    prisma.patient.create({
      data: {
        clinicId: clinic.id,
        name: "Olumide Adesina",
        age: 52,
        gender: "M",
        phone: "+234 803 222 0004",
        bloodGroup: "B+",
        chronicConditions: "Type 2 Diabetes",
      },
    }),
    prisma.patient.create({
      data: {
        clinicId: clinic.id,
        name: "Fatima Yusuf",
        age: 8,
        gender: "F",
        nextOfKin: "Hauwa Yusuf (mother) — +234 803 222 0005",
        bloodGroup: "AB+",
        allergies: "Sulfa drugs",
      },
    }),
    prisma.patient.create({
      data: {
        clinicId: clinic.id,
        name: "Emeka Nwosu",
        age: 41,
        gender: "M",
        phone: "+234 803 222 0006",
      },
    }),
    prisma.patient.create({
      data: {
        clinicId: clinic.id,
        name: "Blessing Okonkwo",
        age: 26,
        gender: "F",
        phone: "+234 803 222 0007",
        bloodGroup: "O-",
      },
    }),
  ]);
  console.log(`   ✓ ${patients.length} patients created\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // 5. VISITS — mix of triage levels and statuses, simulating a real queue
  // ─────────────────────────────────────────────────────────────────────────
  console.log("📋 Creating visits...");
  const now = new Date();
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000);

  await prisma.visit.createMany({
    data: [
      // Two emergencies waiting — should sort to top of queue
      {
        patientId: patients[0].id, // Chukwuemeka Eze
        clinicId: clinic.id,
        reason: "Severe chest pain, difficulty breathing",
        triage: "EMERGENCY",
        status: "WAITING",
        vitalsBp: "165/100",
        vitalsTemp: 37.8,
        checkedInAt: minutesAgo(8),
      },
      {
        patientId: patients[3].id, // Fatima Yusuf
        clinicId: clinic.id,
        reason: "High fever, convulsions",
        triage: "EMERGENCY",
        status: "WAITING",
        vitalsTemp: 40.1,
        checkedInAt: minutesAgo(3),
      },

      // Urgent — middle priority
      {
        patientId: patients[1].id, // Aisha Bello
        clinicId: clinic.id,
        reason: "Persistent headache for 3 days",
        triage: "URGENT",
        status: "WAITING",
        vitalsBp: "130/85",
        checkedInAt: minutesAgo(22),
      },
      {
        patientId: patients[4].id, // Emeka Nwosu
        clinicId: clinic.id,
        reason: "Sprained ankle, swelling",
        triage: "URGENT",
        status: "CALLED",
        checkedInAt: minutesAgo(35),
        calledAt: minutesAgo(2),
      },

      // Routine — bottom of queue
      {
        patientId: patients[2].id, // Olumide Adesina
        clinicId: clinic.id,
        reason: "Diabetes follow-up, refill prescription",
        triage: "ROUTINE",
        status: "WAITING",
        vitalsBp: "140/90",
        vitalsWeight: 92.5,
        checkedInAt: minutesAgo(45),
      },
      {
        patientId: patients[5].id, // Blessing Okonkwo
        clinicId: clinic.id,
        reason: "Routine prenatal check",
        triage: "ROUTINE",
        status: "WAITING",
        vitalsBp: "118/76",
        vitalsWeight: 68.0,
        checkedInAt: minutesAgo(60),
      },

      // Completed visits today — for showing history on Patients page
      {
        patientId: patients[2].id, // Olumide had an earlier visit
        clinicId: clinic.id,
        reason: "Diabetes routine check (last month)",
        triage: "ROUTINE",
        status: "SEEN",
        vitalsBp: "138/88",
        vitalsWeight: 93.2,
        diagnosis: "Type 2 Diabetes, well-controlled",
        prescription: "Metformin 500mg twice daily",
        notes: "Patient adhering well. Reviewing again in 30 days.",
        seenByUserId: doctor.id,
        checkedInAt: minutesAgo(60 * 24 * 30), // 30 days ago
        calledAt: minutesAgo(60 * 24 * 30 - 15),
        seenAt: minutesAgo(60 * 24 * 30 - 30),
      },
      {
        patientId: patients[0].id, // Chukwuemeka's earlier visit
        clinicId: clinic.id,
        reason: "BP check (last week)",
        triage: "ROUTINE",
        status: "SEEN",
        vitalsBp: "150/95",
        diagnosis: "Hypertension stage 1",
        prescription: "Amlodipine 5mg daily",
        notes: "Started on antihypertensive. Follow up in 2 weeks.",
        seenByUserId: doctor.id,
        checkedInAt: minutesAgo(60 * 24 * 7),
        calledAt: minutesAgo(60 * 24 * 7 - 10),
        seenAt: minutesAgo(60 * 24 * 7 - 25),
      },
      {
        patientId: patients[1].id, // Aisha's earlier visit
        clinicId: clinic.id,
        reason: "Recurring migraines",
        triage: "URGENT",
        status: "SEEN",
        diagnosis: "Tension headaches, stress-related",
        prescription: "Paracetamol PRN, stress management counselling",
        notes: "Referred to wellness clinic.",
        seenByUserId: doctor.id,
        checkedInAt: minutesAgo(60 * 24 * 14),
        calledAt: minutesAgo(60 * 24 * 14 - 8),
        seenAt: minutesAgo(60 * 24 * 14 - 20),
      },
    ],
  });
  console.log(`   ✓ 9 visits created (3 emergencies/urgent waiting, 3 routine waiting, 3 historical)\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // 6. BEDS — 11 beds across 3 wards, matching frontend mock
  // ─────────────────────────────────────────────────────────────────────────
  console.log("🛏️  Creating beds...");
  await prisma.bed.createMany({
    data: [
      // General ward — 4 beds
      { clinicId: clinic.id, bedNumber: "A1", ward: "General", status: "OCCUPIED", patientId: patients[2].id },
      { clinicId: clinic.id, bedNumber: "A2", ward: "General", status: "AVAILABLE" },
      { clinicId: clinic.id, bedNumber: "A3", ward: "General", status: "AVAILABLE" },
      { clinicId: clinic.id, bedNumber: "A4", ward: "General", status: "OCCUPIED", patientId: patients[4].id },

      // Maternity ward — 4 beds
      { clinicId: clinic.id, bedNumber: "B1", ward: "Maternity", status: "AVAILABLE" },
      { clinicId: clinic.id, bedNumber: "B2", ward: "Maternity", status: "OCCUPIED", patientId: patients[5].id },
      { clinicId: clinic.id, bedNumber: "B3", ward: "Maternity", status: "AVAILABLE" },
      { clinicId: clinic.id, bedNumber: "B4", ward: "Maternity", status: "AVAILABLE" },

      // Emergency ward — 3 beds
      { clinicId: clinic.id, bedNumber: "C1", ward: "Emergency", status: "AVAILABLE" },
      { clinicId: clinic.id, bedNumber: "C2", ward: "Emergency", status: "OCCUPIED", patientId: patients[0].id },
      { clinicId: clinic.id, bedNumber: "C3", ward: "Emergency", status: "AVAILABLE" },
    ],
  });
  console.log("   ✓ 11 beds created across General / Maternity / Emergency\n");

  // ─────────────────────────────────────────────────────────────────────────
  // 7. SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  console.log("✅ Seed complete.\n");
  console.log("Login credentials (dev only):");
  console.log("   admin@democlinic.ng / password123 (ADMIN)");
  console.log("   doctor@democlinic.ng / password123 (DOCTOR)");
  console.log("   reception@democlinic.ng / password123 (RECEPTIONIST)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
