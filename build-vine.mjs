import fs from "node:fs";

const dir = new URL("./", import.meta.url).pathname;
const src = JSON.parse(fs.readFileSync(dir + "vine.json", "utf8"));
const raw = src.data;
raw.sort((a, b) => a.number - b.number);

const BASE = 207, LAST = 247;
if (raw.length !== LAST) throw new Error(`expected ${LAST} cards, got ` + raw.length);
raw.forEach((c, i) => { if (c.number !== i + 1) throw new Error("number gap at " + c.number); });

// t = card type for the second tag; the first tag is the rarity
const cards = raw.map(c => ({ name: c.name, r: c.rarity, t: c.type }));

const RAR = {};
for (const c of raw) RAR[c.rarity] = (RAR[c.rarity] || 0) + 1;
console.log("rarities:", Object.entries(RAR).map(([k, v]) => `${k} ${v}`).join(", "));

// ---- validate the slot math the page will run ----
// every base card is followed by its Silver foil; #208-247 are foil-only singles
const reg = {}, rh = {}, atSlot = [];
let s = 1;
for (let n = 1; n <= BASE; n++) {
  reg[n] = s; atSlot[s++] = { n, rh: false };
  rh[n] = s; atSlot[s++] = { n, rh: true };
}
for (let n = BASE + 1; n <= LAST; n++) { reg[n] = s; atSlot[s++] = { n, rh: false }; }

const total = s - 1;
const page = x => Math.ceil(x / 9);
const spot = x => ((x - 1) % 9) + 1;
const check = (label, got, want) => {
  if (got !== want) throw new Error(`${label}: got ${got}, want ${want}`);
  console.log(`  ok  ${label} = ${got}`);
};

check("total pockets", total, 454);
check("base cards", BASE, 207);
check("foils", Object.keys(rh).length, 207);
check("foil-only singles", LAST - BASE, 40);
check("pages", page(total), 51);
for (let i = 1; i <= total; i++) if (!atSlot[i]) throw new Error("empty slot " + i);

// the two printings of a base card must always be adjacent
for (let n = 1; n <= BASE; n++)
  if (rh[n] !== reg[n] + 1) throw new Error(`#${n} foil not adjacent to its base`);

// boundaries
check("#001 base slot", reg[1], 1);
check("#001 foil slot", rh[1], 2);
check("#207 base slot", reg[207], 413);
check("#207 foil slot", rh[207], 414);
check("#208 slot", reg[208], 415);
check("#208 page", page(reg[208]), 47);
check("#208 spot", spot(reg[208]), 1);
check("#247 slot (last)", reg[247], 454);
check("#247 page", page(reg[247]), 51);
check("#247 spot", spot(reg[247]), 4);
if (rh[208] !== undefined) throw new Error("#208 must have no foil pocket");

console.log("spec example, #026 Ursula:");
check("  name", cards[25].name.split(" - ")[0], "Ursula");
check("  base page", page(reg[26]), 6);
check("  base spot", spot(reg[26]), 6);
check("  foil page", page(rh[26]), 6);
check("  foil spot", spot(rh[26]), 7);

// ---- assemble ----
const b64 = f => fs.readFileSync(dir + f).toString("base64");
let html = fs.readFileSync(dir + "vine-template.html", "utf8");
html = html
  .replace("/*__DATA__*/", JSON.stringify(cards))
  .replace("/*__ARCHIVO__*/", b64("archivo.woff2"))
  .replace("/*__MONO4__*/", b64("plex400.woff2"))
  .replace("/*__MONO6__*/", b64("plex600.woff2"));

if (html.includes("__DATA__") || html.includes("__ARCHIVO__")) throw new Error("placeholder left unfilled");

const outPath = dir + "vine.html";
fs.writeFileSync(outPath, html);
console.log("\nwrote vine.html:", (fs.statSync(outPath).size / 1024).toFixed(0) + " KB");
