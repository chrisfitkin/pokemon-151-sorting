import fs from "node:fs";

const dir = new URL("./", import.meta.url).pathname;
const raw = JSON.parse(fs.readFileSync(dir + "delta.json", "utf8")).data;
raw.sort((a, b) => a.number - b.number);

const MAIN = 103, LAST = 141;
if (raw.length !== LAST) throw new Error(`expected ${LAST} cards, got ` + raw.length);
raw.forEach((c, i) => { if (c.number !== i + 1) throw new Error("number gap at " + c.number); });

const cards = raw.map(c => ({ name: c.name, r: c.rarity, t: c.number > MAIN ? "Secret" : c.rarity }));

const DR = raw.filter(c => c.rarity === "Double Rare").map(c => c.number);
if (DR.length !== 10) throw new Error("expected 10 Double Rares, got " + DR.length);
if (DR.some(n => n > MAIN)) throw new Error("a Double Rare sits outside the main set");
console.log("Double Rares:", DR.join(", "));

// the template hardcodes the same list; they must agree or the slot map drifts
const tpl = fs.readFileSync(dir + "delta-template.html", "utf8");
const m = tpl.match(/const DR = new Set\(\[([\d,]+)\]\)/);
if (!m || m[1] !== DR.join(",")) throw new Error("template DR list does not match delta.json");

const drSet = new Set(DR);
const reg = {}, rh = {}, atSlot = [];
let s = 1;
for (let n = 1; n <= MAIN; n++) {
  reg[n] = s; atSlot[s++] = { n, rh: false };
  if (!drSet.has(n)) { rh[n] = s; atSlot[s++] = { n, rh: true }; }
}
for (let n = MAIN + 1; n <= LAST; n++) { reg[n] = s; atSlot[s++] = { n, rh: false }; }

const total = s - 1;
const page = x => Math.ceil(x / 9);
const spot = x => ((x - 1) % 9) + 1;
const check = (label, got, want) => {
  if (got !== want) throw new Error(`${label}: got ${got}, want ${want}`);
  console.log(`  ok  ${label} = ${got}`);
};

check("total pockets", total, 234);
check("reverse holos", Object.keys(rh).length, 93);
check("secrets #104-141", LAST - MAIN, 38);
check("pages", page(total), 26);
for (let i = 1; i <= total; i++) if (!atSlot[i]) throw new Error("empty slot " + i);

check("#001 regular slot", reg[1], 1);
check("#001 reverse slot", rh[1], 2);
check("#011 ex slot (no reverse)", reg[11], 21);
check("#012 slot after ex", reg[12], 22);
check("#084 Mega Rayquaza ex slot", reg[84], 159);
check("#084 page", page(reg[84]), 18);
check("#084 spot", spot(reg[84]), 6);
check("#103 reverse slot", rh[103], 196);
check("#104 slot", reg[104], 197);
check("#141 slot (last)", reg[141], 234);
check("#141 page", page(reg[141]), 26);
check("#141 spot", spot(reg[141]), 9);

const b64 = f => fs.readFileSync(dir + f).toString("base64");
let html = tpl
  .replace("/*__DATA__*/", JSON.stringify(cards))
  .replace("/*__ARCHIVO__*/", b64("archivo.woff2"))
  .replace("/*__MONO4__*/", b64("plex400.woff2"))
  .replace("/*__MONO6__*/", b64("plex600.woff2"));
if (html.includes("__DATA__") || html.includes("__ARCHIVO__")) throw new Error("placeholder left unfilled");
fs.writeFileSync(dir + "delta-reign.html", html);
console.log("\nwrote delta-reign.html:", (fs.statSync(dir + "delta-reign.html").size / 1024).toFixed(0) + " KB");
