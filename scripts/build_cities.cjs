// scripts/build_cities.js
// Konverzní script: CSV obce ČR (a později SK) → kompaktní JSON pro src/data/cities.json
// Spuštění z root projektu: node scripts/build_cities.js

const fs = require("fs");
const path = require("path");

const INPUT_CZ = path.join(__dirname, "cz_obce.csv");
const INPUT_SK = path.join(__dirname, "sk_obce.csv"); // volitelně, později
const OUTPUT = path.join(__dirname, "..", "src", "data", "cities.json");

function normalize(str) {
  // lowercase, odstranit diakritiku, ořezat mezery
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function parseCsvLine(line) {
  // Jednoduchý CSV parser (data nemá uvozovky)
  return line.split(",");
}

function processCsvFile(filepath, country) {
  if (!fs.existsSync(filepath)) {
    console.log("Soubor neexistuje, přeskakuji:", filepath);
    return [];
  }
  const content = fs.readFileSync(filepath, "utf8");
  const lines = content.split("\n");
  // CZ header: Obec,Kód obce,Okres,Kód okresu,Kraj,Kód kraje,PSČ,Latitude,Longitude
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = parseCsvLine(line);
    if (parts.length < 9) continue;
    const name = parts[0].trim();
    const lat = parseFloat(parts[7]);
    const lng = parseFloat(parts[8]);
    if (!name || isNaN(lat) || isNaN(lng)) continue;
    result.push({ name, lat, lng, country });
  }
  return result;
}

const czCities = processCsvFile(INPUT_CZ, "CZ");
const skCities = processCsvFile(INPUT_SK, "SK");

console.log("ČR obcí:", czCities.length);
console.log("SR obcí:", skCities.length);

// Slouči, řeš duplicity: pro stejné normalized jméno necháme tu první (= obvykle v abecedním pořadí)
// Lepší: pro stejné jméno necháme tu, která má vyšší prioritu (větší město apod.)
// Pro jednoduchost teď: ponechat všechny, ale pokud je více se stejným normalized name, lookup
// vybere první. Pro velká města (Praha, Brno) to není problém — jsou unikátní.

const all = [...czCities, ...skCities];

// Vytvoříme mapu pro rychlý lookup: normalized name → {lat, lng, country, origName}
// Při kolizi (stejný normalized name): preferujeme tu s kratším názvem (= bez upřesnění typu "Adamov" vs "Adamov u Mostu")
const lookupMap = {};
for (const city of all) {
  const norm = normalize(city.name);
  if (!norm) continue;
  if (!lookupMap[norm]) {
    lookupMap[norm] = city;
  } else {
    // Kolize — preferovat kratší jméno
    if (city.name.length < lookupMap[norm].name.length) {
      lookupMap[norm] = city;
    }
  }
}

console.log("Unikátních normalized jmen:", Object.keys(lookupMap).length);

// Výsledný kompaktní formát: pole [normalized_name, lat, lng, country_code]
// To je o cca 30 % úspornější než JSON s klíči
const compact = Object.entries(lookupMap).map(([norm, c]) => [
  norm,
  Math.round(c.lat * 10000) / 10000, // zkrátit na 4 desetinné místa (~10 metrů přesnost)
  Math.round(c.lng * 10000) / 10000,
  c.country
]);

// Seřadit abecedně pro lepší kompresi (gzip)
compact.sort((a, b) => a[0].localeCompare(b[0]));

// Ujistit se, že cílový adresář existuje
const targetDir = path.dirname(OUTPUT);
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(OUTPUT, JSON.stringify(compact));
console.log("Uloženo do:", OUTPUT);
console.log("Velikost:", fs.statSync(OUTPUT).size, "B");
