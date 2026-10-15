import { describe, expect, it } from "vitest";
import { COMPONENT_ROLE_ORDER, normalizeText, resolveRuleBased } from "@/lib/ai/rule-based";

describe("normalizeText", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalizeText("Smart-Plant, Watering!")).toBe("smart plant watering");
  });
});

describe("resolveRuleBased", () => {
  it("builds a complete plant watering kit with correct quantities", () => {
    const kit = resolveRuleBased("ESP32 smart plant watering system");
    const names = kit.map((s) => s.name);
    expect(names).toContain("Soil Moisture Sensor");
    expect(names).toContain("Water Pump (DC 5V)");
    expect(names).toContain("Relay Module 2-Channel");
    expect(names).toContain("DHT22 Temperature & Humidity Sensor");
    expect(names.some((n) => n.includes("ESP32"))).toBe(true);

    const soil = kit.find((s) => s.name === "Soil Moisture Sensor");
    expect(soil?.quantity).toBe(2);
  });

  it("matches the weather station sensors and a display", () => {
    const names = resolveRuleBased("Wi-Fi weather station with rainfall").map((s) => s.name);
    expect(names.some((n) => n.includes("DHT22"))).toBe(true);
    expect(names).toContain("Rain Sensor Module");
    expect(names).toContain("16x2 LCD Display");
  });

  it("always includes a controller and the wiring/power essentials", () => {
    const kit = resolveRuleBased("generic thingamajig with no keywords");
    const roles = kit.map((s) => s.role);
    expect(roles.filter((r) => r === "controller")).toHaveLength(1);
    expect(kit.map((s) => s.name)).toContain("Breadboard + Jumper Wires");
    expect(kit.some((s) => s.role === "essential")).toBe(true);
  });

  it("gives a portable build a battery instead of a bench supply", () => {
    const names = resolveRuleBased("obstacle avoiding robot car").map((s) => s.name);
    expect(names).toContain("Battery Pack (9V/AA)");
    expect(names).not.toContain("5V 2A Power Supply");
    expect(names).toContain("DC Motor + L298N Driver");
  });

  it("activates every role from the known set and keeps them ordered", () => {
    const roles = resolveRuleBased("rfid attendance door lock system").map((s) => s.role);
    for (const role of roles) expect(COMPONENT_ROLE_ORDER).toContain(role);
    const indices = roles.map((r) => COMPONENT_ROLE_ORDER.indexOf(r));
    expect([...indices].sort((a, b) => a - b)).toEqual(indices);
  });

  it("returns no duplicates and respects maxItems", () => {
    const results = resolveRuleBased("iot esp32 wifi temperature humidity display camera motor security", 3);
    expect(results).toHaveLength(3);
    const names = results.map((r) => r.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("always returns positive quantities and a valid role", () => {
    for (const s of resolveRuleBased("robot car with ultrasonic and servo")) {
      expect(s.quantity).toBeGreaterThan(0);
      expect(COMPONENT_ROLE_ORDER).toContain(s.role);
    }
  });
});
