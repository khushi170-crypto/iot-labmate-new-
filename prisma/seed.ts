import "dotenv/config";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hash } from "bcryptjs";

function resolveDatabaseUrl(raw: string | undefined): string {
  const value = raw?.trim() || "file:./dev.db";
  if (!value.startsWith("file:")) return value;
  let rest = value.slice("file:".length);
  if (rest.startsWith("./")) rest = rest.slice(2);
  if (path.isAbsolute(rest)) return rest.replace(/\\/g, "/");
  return path.join(process.cwd(), rest).replace(/\\/g, "/");
}

const url = resolveDatabaseUrl(process.env.DATABASE_URL);
const adapter = new PrismaBetterSqlite3({ url });
const db = new PrismaClient({ adapter });

async function main() {
  await db.payment.deleteMany();
  await db.fine.deleteMany();
  await db.bookingItem.deleteMany();
  await db.booking.deleteMany();
  await db.complaint.deleteMany();
  await db.equipment.deleteMany();
  await db.category.deleteMany();
  await db.appSetting.deleteMany();
  await db.user.deleteMany();

  const studentHash = await hash("student123", 12);
  const assistantHash = await hash("assistant123", 12);

  const student = await db.user.create({
    data: {
      name: "Aarav Student",
      email: "student@labmate.edu",
      passwordHash: studentHash,
      role: "STUDENT",
      phone: "+91 98765 43210",
    },
  });

  const assistant = await db.user.create({
    data: {
      name: "Maya Lab Assistant",
      email: "assistant@labmate.edu",
      passwordHash: assistantHash,
      role: "LAB_ASSISTANT",
    },
  });

  const [micro, sensors, actuators, display, cameras, connectivity, power] = await Promise.all([
    db.category.create({ data: { name: "Microcontrollers", slug: "microcontrollers", description: "Dev boards & single-board computers" } }),
    db.category.create({ data: { name: "Sensors", slug: "sensors", description: "Environment and object sensing" } }),
    db.category.create({ data: { name: "Actuators", slug: "actuators", description: "Motors, relays and output devices" } }),
    db.category.create({ data: { name: "Display & Interface", slug: "display-interface", description: "Screens and input/output" } }),
    db.category.create({ data: { name: "Cameras", slug: "cameras", description: "Image and video capture" } }),
    db.category.create({ data: { name: "Connectivity", slug: "connectivity", description: "Wireless modules" } }),
    db.category.create({ data: { name: "Power & Wiring", slug: "power-wiring", description: "Power supplies and prototyping" } }),
  ]);

  const equipmentSeed: Array<{
    name: string;
    categoryId: string;
    description: string;
    totalQty: number;
    availableQty: number;
    condition: "NEW" | "GOOD" | "FAIR" | "DAMAGED";
  }> = [
    { name: "Arduino Uno R3", categoryId: micro.id, description: "ATmega328P microcontroller board", totalQty: 12, availableQty: 8, condition: "GOOD" },
    { name: "ESP32 Dev Board", categoryId: micro.id, description: "Wi-Fi + Bluetooth development board", totalQty: 10, availableQty: 10, condition: "NEW" },
    { name: "ESP8266 NodeMCU", categoryId: micro.id, description: "Low-cost Wi-Fi microcontroller board", totalQty: 8, availableQty: 8, condition: "GOOD" },
    { name: "Raspberry Pi 4", categoryId: micro.id, description: "4GB single-board computer", totalQty: 4, availableQty: 1, condition: "GOOD" },
    { name: "DHT22 Temperature & Humidity Sensor", categoryId: sensors.id, description: "Digital temperature and humidity probe", totalQty: 15, availableQty: 12, condition: "NEW" },
    { name: "DS18B20 Temperature Sensor", categoryId: sensors.id, description: "Waterproof digital temperature probe", totalQty: 9, availableQty: 9, condition: "NEW" },
    { name: "HC-SR04 Ultrasonic Sensor", categoryId: sensors.id, description: "Distance measurement up to 4m", totalQty: 14, availableQty: 6, condition: "GOOD" },
    { name: "PIR Motion Sensor", categoryId: sensors.id, description: "Human presence detection", totalQty: 12, availableQty: 12, condition: "GOOD" },
    { name: "Soil Moisture Sensor", categoryId: sensors.id, description: "Capacitive soil moisture probe", totalQty: 10, availableQty: 4, condition: "FAIR" },
    { name: "MQ-2 Gas Sensor", categoryId: sensors.id, description: "Smoke and combustible gas detector", totalQty: 8, availableQty: 8, condition: "NEW" },
    { name: "Rain Sensor Module", categoryId: sensors.id, description: "Rainfall detection board", totalQty: 7, availableQty: 7, condition: "GOOD" },
    { name: "LDR Light Sensor", categoryId: sensors.id, description: "Photoresistor light-level module", totalQty: 15, availableQty: 14, condition: "GOOD" },
    { name: "SG90 Servo Motor", categoryId: actuators.id, description: "180° micro servo for actuation", totalQty: 16, availableQty: 10, condition: "GOOD" },
    { name: "DC Motor + L298N Driver", categoryId: actuators.id, description: "Dual DC motor driver kit", totalQty: 9, availableQty: 7, condition: "GOOD" },
    { name: "Stepper Motor + Driver", categoryId: actuators.id, description: "28BYJ-48 stepper with ULN2003 driver", totalQty: 6, availableQty: 6, condition: "GOOD" },
    { name: "Water Pump (DC 5V)", categoryId: actuators.id, description: "Submersible pump for irrigation projects", totalQty: 8, availableQty: 5, condition: "GOOD" },
    { name: "Relay Module 2-Channel", categoryId: actuators.id, description: "Switches AC/DC appliances", totalQty: 11, availableQty: 11, condition: "NEW" },
    { name: "Active Buzzer", categoryId: actuators.id, description: "5V piezo buzzer for alerts", totalQty: 20, availableQty: 18, condition: "NEW" },
    { name: "LED Module", categoryId: actuators.id, description: "RGB LED indicator module", totalQty: 22, availableQty: 20, condition: "GOOD" },
    { name: "16x2 LCD Display", categoryId: display.id, description: "HD44780 character LCD", totalQty: 12, availableQty: 9, condition: "GOOD" },
    { name: "OLED Display SSD1306", categoryId: display.id, description: "0.96\" I2C OLED", totalQty: 8, availableQty: 8, condition: "NEW" },
    { name: "4x4 Matrix Keypad", categoryId: display.id, description: "Membrane keypad for numeric input", totalQty: 6, availableQty: 6, condition: "GOOD" },
    { name: "Camera Module OV2640", categoryId: cameras.id, description: "2MP camera for ESP32/Arduino", totalQty: 5, availableQty: 3, condition: "GOOD" },
    { name: "HC-05 Bluetooth Module", categoryId: connectivity.id, description: "Serial-to-Bluetooth adapter", totalQty: 10, availableQty: 10, condition: "NEW" },
    { name: "RFID RC522 Kit", categoryId: connectivity.id, description: "13.56MHz RFID reader with tags", totalQty: 6, availableQty: 5, condition: "GOOD" },
    { name: "GPS Module NEO-6M", categoryId: connectivity.id, description: "GPS receiver with antenna", totalQty: 5, availableQty: 5, condition: "NEW" },
    { name: "5V 2A Power Supply", categoryId: power.id, description: "Regulated bench power adapter", totalQty: 10, availableQty: 10, condition: "GOOD" },
    { name: "Battery Pack (9V/AA)", categoryId: power.id, description: "Portable battery holder with clip", totalQty: 9, availableQty: 9, condition: "GOOD" },
    { name: "Breadboard + Jumper Wires", categoryId: power.id, description: "830-point breadboard prototyping kit", totalQty: 18, availableQty: 11, condition: "FAIR" },
  ];

  const created = new Map<string, string>();
  for (const eq of equipmentSeed) {
    const row = await db.equipment.create({ data: eq });
    created.set(eq.name, row.id);
  }

  await db.appSetting.createMany({
    data: [
      { key: "fineRatePerDay", value: "10" },
      { key: "loanPeriodDays", value: "7" },
      { key: "currency", value: "$" },
      { key: "aiProvider", value: "rule-based" },
    ],
  });

  const now = new Date();

  // PENDING booking (awaiting assistant approval)
  await db.booking.create({
    data: {
      code: "LM-DEMO1",
      studentId: student.id,
      status: "PENDING",
      notes: "Wi-Fi weather station for final year project",
      items: {
        create: [{ equipmentId: created.get("ESP32 Dev Board")!, quantity: 1 }],
      },
    },
  });

  // ISSUED booking, due in 5 days
  await db.booking.create({
    data: {
      code: "LM-DEMO2",
      studentId: student.id,
      status: "ISSUED",
      approvedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      approvedById: assistant.id,
      issuedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      dueAt: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          { equipmentId: created.get("DHT22 Temperature & Humidity Sensor")!, quantity: 1, conditionOnIssue: "NEW" },
          { equipmentId: created.get("Breadboard + Jumper Wires")!, quantity: 1, conditionOnIssue: "FAIR" },
        ],
      },
    },
  });

  // RETURNED booking that was 3 days late → creates an UNPAID fine
  const returned = await db.booking.create({
    data: {
      code: "LM-DEMO3",
      studentId: student.id,
      status: "RETURNED",
      approvedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      approvedById: assistant.id,
      issuedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      dueAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      returnedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      items: {
        create: [{ equipmentId: created.get("Arduino Uno R3")!, quantity: 1, conditionOnIssue: "GOOD", conditionOnReturn: "GOOD" }],
      },
    },
  });
  await db.fine.create({
    data: {
      bookingId: returned.id,
      studentId: student.id,
      amount: 30,
      daysLate: 3,
      rateApplied: 10,
      status: "UNPAID",
    },
  });

  await db.complaint.create({
    data: {
      studentId: student.id,
      subject: "Arduino Uno power LED not glowing",
      message: "The Arduino Uno I borrowed in the previous session seems dead. Could it be checked before re-issuing?",
    },
  });

  console.log("Seed complete");
  console.log("  Student:      student@labmate.edu / student123");
  console.log("  Lab Assistant: assistant@labmate.edu / assistant123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });