export type ComponentRole =
  | "controller"
  | "sensor"
  | "actuator"
  | "module"
  | "display"
  | "connectivity"
  | "essential";

export interface AiSuggestion {
  name: string;
  quantity: number;
  reason: string;
  role: ComponentRole;
}

/** Display order for grouping a kit in the UI (controller first, essentials last). */
export const COMPONENT_ROLE_ORDER: ComponentRole[] = [
  "controller",
  "sensor",
  "actuator",
  "module",
  "display",
  "connectivity",
  "essential",
];

export const COMPONENT_ROLE_LABEL: Record<ComponentRole, string> = {
  controller: "Controller",
  sensor: "Sensors",
  actuator: "Actuators & Outputs",
  module: "Modules",
  display: "Displays",
  connectivity: "Connectivity",
  essential: "Essentials",
};

interface PartDef {
  name: string;
  role: ComponentRole;
  quantity: number;
  reason: string;
}

const PARTS = {
  arduino: { name: "Arduino Uno R3", role: "controller", quantity: 1, reason: "Reliable microcontroller for wiring-based projects" },
  esp32: { name: "ESP32 Dev Board", role: "controller", quantity: 1, reason: "Microcontroller with built-in Wi-Fi and Bluetooth" },
  rpi: { name: "Raspberry Pi 4", role: "controller", quantity: 1, reason: "Single-board computer for camera and heavy processing" },

  dht22: { name: "DHT22 Temperature & Humidity Sensor", role: "sensor", quantity: 1, reason: "Measures ambient temperature and humidity" },
  ds18b20: { name: "DS18B20 Temperature Sensor", role: "sensor", quantity: 1, reason: "Waterproof digital temperature probe" },
  soil: { name: "Soil Moisture Sensor", role: "sensor", quantity: 1, reason: "Reads soil moisture for watering decisions" },
  ultrasonic: { name: "HC-SR04 Ultrasonic Sensor", role: "sensor", quantity: 1, reason: "Measures distance / level with sound waves" },
  pir: { name: "PIR Motion Sensor", role: "sensor", quantity: 1, reason: "Detects human motion" },
  gas: { name: "MQ-2 Gas Sensor", role: "sensor", quantity: 1, reason: "Detects smoke and combustible gas" },
  rain: { name: "Rain Sensor Module", role: "sensor", quantity: 1, reason: "Detects rainfall" },
  ldr: { name: "LDR Light Sensor", role: "sensor", quantity: 1, reason: "Measures ambient light level" },
  camera: { name: "Camera Module OV2640", role: "sensor", quantity: 1, reason: "Captures images / video for vision tasks" },

  servo: { name: "SG90 Servo Motor", role: "actuator", quantity: 1, reason: "Precise angular movement (locks, arms, lids)" },
  motor: { name: "DC Motor + L298N Driver", role: "actuator", quantity: 1, reason: "Drives wheels / motion" },
  stepper: { name: "Stepper Motor + Driver", role: "actuator", quantity: 1, reason: "Accurate rotational positioning" },
  pump: { name: "Water Pump (DC 5V)", role: "actuator", quantity: 1, reason: "Delivers water for irrigation" },
  relay: { name: "Relay Module 2-Channel", role: "actuator", quantity: 1, reason: "Switches higher-power AC/DC loads" },
  buzzer: { name: "Active Buzzer", role: "actuator", quantity: 1, reason: "Audible alerts and alarms" },
  led: { name: "LED Module", role: "actuator", quantity: 1, reason: "Visual indicators and lighting" },

  oled: { name: "OLED Display SSD1306", role: "display", quantity: 1, reason: "Compact on-device readout" },
  lcd: { name: "16x2 LCD Display", role: "display", quantity: 1, reason: "Character display for readings and status" },

  keypad: { name: "4x4 Matrix Keypad", role: "module", quantity: 1, reason: "Numeric input for code / menu entry" },
  rfid: { name: "RFID RC522 Kit", role: "module", quantity: 1, reason: "Reads RFID cards / tags for identification" },

  hc05: { name: "HC-05 Bluetooth Module", role: "connectivity", quantity: 1, reason: "Adds Bluetooth to a board without it" },
  esp8266: { name: "ESP8266 NodeMCU", role: "connectivity", quantity: 1, reason: "Adds Wi-Fi to a board without it" },
  gps: { name: "GPS Module NEO-6M", role: "connectivity", quantity: 1, reason: "Provides GPS location coordinates" },

  wireKit: { name: "Breadboard + Jumper Wires", role: "essential", quantity: 1, reason: "Prototyping base and wiring" },
  powerSupply: { name: "5V 2A Power Supply", role: "essential", quantity: 1, reason: "Safe regulated power for the circuit" },
  battery: { name: "Battery Pack (9V/AA)", role: "essential", quantity: 1, reason: "Portable power for a moving / remote build" },
} satisfies Record<string, PartDef>;

type PartKey = keyof typeof PARTS;

/** Wiring/power items that every kit needs, regardless of the project. */
const ESSENTIAL_PARTS = new Set<PartKey>(["wireKit", "powerSupply", "battery"]);

interface ProfilePart {
  part: PartKey;
  quantity?: number;
  reason?: string;
}

interface ProjectProfile {
  id: string;
  label: string;
  keywords: string[];
  controller?: PartKey;
  parts: ProfilePart[];
}

/** Archetypal projects with a complete, correctly-sized bill of materials. */
const PROFILES: ProjectProfile[] = [
  {
    id: "weather",
    label: "weather station",
    keywords: ["weather", "temperature", "humidity", "climate", "forecast", "meteo"],
    parts: [{ part: "dht22" }, { part: "rain" }, { part: "lcd" }],
  },
  {
    id: "plant",
    label: "plant watering system",
    keywords: ["plant", "irrigation", "watering", "garden", "soil", "farming", "agriculture", "greenhouse"],
    parts: [
      { part: "soil", quantity: 2, reason: "Two probes cover two soil zones / beds" },
      { part: "pump" },
      { part: "relay", reason: "Switches the pump on and off" },
      { part: "dht22", reason: "Tracks temperature and humidity around the plants" },
      { part: "lcd" },
    ],
  },
  {
    id: "security",
    label: "security & alarm system",
    keywords: ["security", "alarm", "intruder", "burglar", "motion", "trespass"],
    parts: [
      { part: "pir", quantity: 2, reason: "Two sensors cover a wider area" },
      { part: "buzzer" },
      { part: "relay", reason: "Can drive a siren or light" },
      { part: "lcd" },
    ],
  },
  {
    id: "smart-home",
    label: "smart home controller",
    keywords: ["smart home", "home automation", "home", "appliance", "smart switch", "fan", "home controller"],
    parts: [
      { part: "relay", quantity: 2, reason: "Control two appliances independently" },
      { part: "dht22" },
      { part: "lcd" },
    ],
  },
  {
    id: "robot",
    label: "mobile robot / car",
    keywords: ["robot", "rover", "obstacle", "car", "vehicle", "line follower", "self driving", "wheel"],
    parts: [
      { part: "motor" },
      { part: "ultrasonic", reason: "Detects obstacles ahead" },
      { part: "servo", reason: "Pans the distance sensor / steering" },
    ],
  },
  {
    id: "rfid",
    label: "RFID access / attendance system",
    keywords: ["rfid", "attendance", "access control", "door lock", "smart lock", "entry", "nfc", "id card"],
    parts: [
      { part: "rfid" },
      { part: "servo", reason: "Drives the lock / gate" },
      { part: "buzzer" },
      { part: "lcd" },
    ],
  },
  {
    id: "gps",
    label: "GPS tracking device",
    keywords: ["gps", "tracking", "tracker", "location", "navigation", "geolocation", "fleet"],
    parts: [{ part: "gps" }, { part: "lcd" }],
  },
  {
    id: "air-quality",
    label: "air quality / gas monitor",
    keywords: ["air quality", "gas", "smoke", "pollution", "leak", "co2", "hazard", "toxic", "mq 2", "mq2"],
    parts: [{ part: "gas" }, { part: "buzzer" }, { part: "lcd" }],
  },
  {
    id: "level",
    label: "distance / level monitor",
    keywords: ["distance", "water level", "level", "parking", "range finder", "proximity", "height"],
    parts: [{ part: "ultrasonic" }, { part: "lcd" }],
  },
  {
    id: "vision",
    label: "camera / vision project",
    keywords: ["camera", "vision", "face", "image", "recognition", "photo", "video", "surveillance"],
    controller: "rpi",
    parts: [{ part: "camera" }, { part: "oled" }],
  },
  {
    id: "traffic",
    label: "traffic / signal lights",
    keywords: ["traffic", "traffic light", "signal", "blink", "street light", "pedestrian"],
    parts: [
      { part: "led", quantity: 3, reason: "Red / amber / green signal heads" },
      { part: "buzzer" },
    ],
  },
  {
    id: "lock",
    label: "keypad door lock",
    keywords: ["keypad", "password", "passcode", "pin code", "digital lock", "combination"],
    parts: [{ part: "keypad" }, { part: "servo" }, { part: "buzzer" }, { part: "lcd" }],
  },
  {
    id: "logger",
    label: "temperature data logger",
    keywords: ["logger", "datalogger", "data logging", "logging", "cold chain", "incubator", "temperature monitor", "record temperature"],
    parts: [{ part: "ds18b20" }, { part: "lcd" }],
  },
];

/** Distinctive component codes/names that should always pull in that part. */
const EXPLICIT: Array<{ part: PartKey; terms: string[] }> = [
  { part: "dht22", terms: ["dht22", "dht11"] },
  { part: "ds18b20", terms: ["ds18b20"] },
  { part: "soil", terms: ["soil moisture"] },
  { part: "ultrasonic", terms: ["hc sr04", "ultrasonic"] },
  { part: "pir", terms: ["pir"] },
  { part: "gas", terms: ["mq 2", "mq2", "mq135", "gas sensor"] },
  { part: "rain", terms: ["rain sensor", "rainfall"] },
  { part: "ldr", terms: ["ldr", "photoresistor"] },
  { part: "camera", terms: ["camera", "ov2640"] },
  { part: "servo", terms: ["servo", "sg90"] },
  { part: "motor", terms: ["l298n", "dc motor"] },
  { part: "stepper", terms: ["stepper", "28byj"] },
  { part: "pump", terms: ["water pump"] },
  { part: "relay", terms: ["relay"] },
  { part: "buzzer", terms: ["buzzer", "siren"] },
  { part: "led", terms: ["rgb led", "led module"] },
  { part: "oled", terms: ["oled", "ssd1306"] },
  { part: "lcd", terms: ["lcd", "16x2"] },
  { part: "keypad", terms: ["keypad"] },
  { part: "rfid", terms: ["rfid", "rc522"] },
  { part: "hc05", terms: ["hc 05", "hc05"] },
  { part: "esp8266", terms: ["esp8266", "nodemcu"] },
  { part: "gps", terms: ["neo 6m", "neo6m"] },
];

const WIFI_TERMS = ["wifi", "wi fi", "wireless", "internet", "cloud", "iot", "online", "remote", "dashboard", "notification", "notify", "smart home", "home automation"];
const BLUETOOTH_TERMS = ["bluetooth", "hc 05", "hc05", "phone app", "mobile app", "android", "smartphone"];
const HEAVY_TERMS = ["raspberry", "rpi", "computer vision", "machine learning", "deep learning", "opencv", "face recognition", "image recognition"];
const PORTABLE_TERMS = ["portable", "wearable", "remote", "field", "drone", "robot", "rover", "car", "vehicle", "tracker", "gps", "solar", "battery"];

export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export const RULE_SOURCE = "rule-based";

function roleIndex(role: ComponentRole): number {
  return COMPONENT_ROLE_ORDER.indexOf(role);
}

export function resolveRuleBased(idea: string, maxItems = 12): AiSuggestion[] {
  const text = normalizeText(idea);
  const limit = Math.max(1, Math.floor(maxItems) || 1);
  const has = (terms: string[]) => terms.some((term) => text.includes(term));

  const requests = new Map<PartKey, { quantity: number; reason: string }>();
  const request = (part: PartKey, quantity?: number, reason?: string) => {
    const def = PARTS[part];
    const qty = Math.max(1, quantity ?? def.quantity);
    const existing = requests.get(part);
    if (!existing) {
      requests.set(part, { quantity: qty, reason: reason ?? def.reason });
      return;
    }
    existing.quantity = Math.max(existing.quantity, qty);
  };

  // 1. Match project archetypes and pull in their component lists.
  const matched = PROFILES.map((profile, index) => ({
    profile,
    index,
    hits: profile.keywords.filter((keyword) => text.includes(keyword)),
  }))
    .filter((entry) => entry.hits.length > 0)
    .sort((a, b) => b.hits.length - a.hits.length || a.index - b.index);

  const primary = matched[0]?.profile;
  for (const { profile } of matched) {
    for (const part of profile.parts) request(part.part, part.quantity, part.reason);
  }

  // 2. Honour explicitly named components.
  for (const { part, terms } of EXPLICIT) {
    if (has(terms)) request(part);
  }

  // 3. Pick a single controller based on the project and connectivity needs.
  const wantsWifi = has(WIFI_TERMS);
  const wantsBluetooth = has(BLUETOOTH_TERMS);
  let controller: PartKey;
  if (text.includes("esp32")) controller = "esp32";
  else if (has(HEAVY_TERMS)) controller = "rpi";
  else if (text.includes("arduino")) controller = "arduino";
  else if (wantsWifi || wantsBluetooth) controller = "esp32";
  else controller = primary?.controller ?? "arduino";

  for (const candidate of ["arduino", "esp32", "rpi"] as PartKey[]) {
    if (candidate !== controller) requests.delete(candidate);
  }
  request(controller, 1, `Main controller for your ${primary?.label ?? "IoT build"}`);

  if (wantsBluetooth && controller !== "esp32") request("hc05");
  if (wantsWifi && controller === "arduino") request("esp8266");

  // 4. Every kit needs wiring and power.
  request("wireKit");
  const wantsBattery = text.includes("solar") || text.includes("battery") || (has(PORTABLE_TERMS) && !text.includes("power supply"));
  request(wantsBattery ? "battery" : "powerSupply");

  // 5. Order by role, then trim while always reserving the controller and essentials.
  const keys = [...requests.keys()].sort((a, b) => roleIndex(PARTS[a].role) - roleIndex(PARTS[b].role));
  const reserved = new Set<PartKey>(keys.filter((k) => PARTS[k].role === "controller" || ESSENTIAL_PARTS.has(k)));
  for (const key of keys) {
    if (reserved.size >= limit) break;
    reserved.add(key);
  }
  const finalKeys = keys.filter((key) => reserved.has(key));

  return finalKeys.map((key) => {
    const def = PARTS[key];
    const entry = requests.get(key)!;
    return { name: def.name, quantity: entry.quantity, reason: entry.reason, role: def.role };
  });
}
