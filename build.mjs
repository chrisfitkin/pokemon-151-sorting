import fs from "node:fs";

const dir = new URL("./", import.meta.url).pathname;
const raw = JSON.parse(fs.readFileSync(dir + "151.json", "utf8")).data;
raw.sort((a, b) => +a.number - +b.number);

if (raw.length !== 207) throw new Error("expected 207 cards, got " + raw.length);
raw.forEach((c, i) => { if (+c.number !== i + 1) throw new Error("number gap at " + c.number); });

// t = supertype for Pokemon/Energy, the trainer subtype for Trainers (more useful on screen)
const cards = raw.map(c => ({
  name: c.name,
  r: c.rarity,
  t: c.supertype === "Trainer" ? (c.subtypes?.[0] || "Trainer") : c.supertype,
}));

const DR = raw.filter(c => c.rarity === "Double Rare").map(c => +c.number);
if (DR.length !== 12) throw new Error("expected 12 Double Rares, got " + DR.length);
console.log("Double Rares:", DR.join(", "));

// ---- validate the slot math the page will run ----
const drSet = new Set(DR);
const reg = {}, rh = {}, atSlot = [];
let s = 1;
for (let n = 1; n <= 165; n++) {
  reg[n] = s; atSlot[s++] = { n, rh: false };
  if (!drSet.has(n)) { rh[n] = s; atSlot[s++] = { n, rh: true }; }
}
for (let n = 166; n <= 207; n++) { reg[n] = s; atSlot[s++] = { n, rh: false }; }

const total = s - 1;
const page = x => Math.ceil(x / 9);
const spot = x => ((x - 1) % 9) + 1;
const check = (label, got, want) => {
  if (got !== want) throw new Error(`${label}: got ${got}, want ${want}`);
  console.log(`  ok  ${label} = ${got}`);
};

check("total pockets", total, 360);
check("base cards", 165, 165);
check("reverse holos", Object.keys(rh).length, 153);
check("secrets #166-207", 207 - 165, 42);
for (let i = 1; i <= 360; i++) if (!atSlot[i]) throw new Error("empty slot " + i);

console.log("spec example, #067 Machoke:");
check("  name", cards[66].name, "Machoke");
check("  regular page", page(reg[67]), 14);
check("  regular spot", spot(reg[67]), 9);
check("  reverse page", page(rh[67]), 15);
check("  reverse spot", spot(rh[67]), 1);

// boundaries
check("#001 regular slot", reg[1], 1);
check("#003 ex regular slot", reg[3], 5);
check("#004 slot after ex", reg[4], 6);
check("#165 reverse slot", rh[165], 318);
check("#166 slot", reg[166], 319);
check("#207 slot (last)", reg[207], 360);
check("#207 page", page(reg[207]), 40);
check("#207 spot", spot(reg[207]), 9);

// ---- assemble ----
const b64 = f => fs.readFileSync(dir + f).toString("base64");
let html = fs.readFileSync(dir + "template.html", "utf8");
html = html
  .replace("/*__DATA__*/", JSON.stringify(cards))
  .replace("/*__ARCHIVO__*/", b64("archivo.woff2"))
  .replace("/*__MONO4__*/", b64("plex400.woff2"))
  .replace("/*__MONO6__*/", b64("plex600.woff2"));

if (html.includes("__DATA__") || html.includes("__ARCHIVO__")) throw new Error("placeholder left unfilled");

const outPath = dir + "index.html";
fs.writeFileSync(outPath, html);
console.log("\nwrote index.html:", (fs.statSync(outPath).size / 1024).toFixed(0) + " KB");
