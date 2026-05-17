// scripts/build_cities.cjs
// Konverzní script: obce ČR (CSV) + obce SR (GeoJSON) → kompaktní JSON pro src/data/cities.json
// Spuštění z root projektu: node scripts/build_cities.cjs
//
// Vstupy:
//   scripts/cz_obce.csv  (https://raw.githubusercontent.com/33bcdd/souradnice-mest/master/souradnice.csv)
//   scripts/sk_obce.geojson  (https://raw.githubusercontent.com/drakh/slovakia-gps-data/master/GeoJSON/epsg_4326/cities_regions_districts_epsg_4326.geojson)
//
// Výstup:
//   src/data/cities.json — pole [normalized_name, lat, lng, country_code], seřazeno abecedně

const fs = require("fs");
const path = require("path");

const INPUT_CZ = path.join(__dirname, "cz_obce.csv");
const INPUT_SK = path.join(__dirname, "sk_obce.geojson");
const OUTPUT = path.join(__dirname, "..", "src", "data", "cities.json");

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function processCzCsv(filepath) {
  if (!fs.existsSync(filepath)) {
    console.log("Soubor neexistuje, přeskakuji:", filepath);
    return [];
  }
  const content = fs.readFileSync(filepath, "utf8");
  const lines = content.split("\n");
  // Header: Obec,Kód obce,Okres,Kód okresu,Kraj,Kód kraje,PSČ,Latitude,Longitude
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(",");
    if (parts.length < 9) continue;
    const name = parts[0].trim();
    const lat = parseFloat(parts[7]);
    const lng = parseFloat(parts[8]);
    if (!name || isNaN(lat) || isNaN(lng)) continue;
    result.push({ name, lat, lng, country: "CZ" });
  }
  return result;
}

function processSkGeojson(filepath) {
  if (!fs.existsSync(filepath)) {
    console.log("Soubor neexistuje, přeskakuji:", filepath);
    return [];
  }
  const content = fs.readFileSync(filepath, "utf8");
  const data = JSON.parse(content);
  const result = [];
  if (!data.features || !Array.isArray(data.features)) {
    console.warn("SK GeoJSON nemá pole 'features'");
    return [];
  }
  for (const feature of data.features) {
    try {
      const props = feature.properties || {};
      const geom = feature.geometry || {};
      // Akceptujeme city, town, village, hamlet (preferujeme větší typy)
      const type = props.type || "";
      if (!["city", "town", "village", "hamlet"].includes(type)) continue;
      const name = (props.name || "").trim();
      if (!name) continue;
      // GeoJSON má coordinates jako [lng, lat]
      const coords = geom.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) continue;
      const lng = parseFloat(coords[0]);
      const lat = parseFloat(coords[1]);
      if (isNaN(lat) || isNaN(lng)) continue;
      result.push({ name, lat, lng, country: "SK", type });
    } catch (e) {
      // skip
    }
  }
  return result;
}

const czCities = processCzCsv(INPUT_CZ);
const skCities = processSkGeojson(INPUT_SK);

console.log("ČR obcí:", czCities.length);
console.log("SR obcí:", skCities.length);

// Priorita typů pro řešení duplicit (větší = lepší)
const typeRank = { city: 4, town: 3, village: 2, hamlet: 1 };

// Slouči, řeš duplicity:
// 1) Stejný normalized name napříč zeměmi: preferujeme stát s větším městem podle typu
// 2) Stejný normalized name v rámci jednoho státu: preferujeme kratší název (Adamov < Adamov u Mostu)
const all = [...czCities, ...skCities];
const lookupMap = {};
for (const city of all) {
  const norm = normalize(city.name);
  if (!norm) continue;
  const existing = lookupMap[norm];
  if (!existing) {
    lookupMap[norm] = city;
    continue;
  }
  // Kolize. Pravidla:
  // a) Pokud má jeden vyšší typeRank (jen SK má type) → tomu dáme přednost
  const newRank = typeRank[city.type] || 0;
  const oldRank = typeRank[existing.type] || 0;
  if (newRank > oldRank) {
    lookupMap[norm] = city;
    continue;
  }
  if (newRank < oldRank) continue;
  // b) Pokud má jeden kratší jméno (méně suffixu) → preferujeme ho
  if (city.name.length < existing.name.length) {
    lookupMap[norm] = city;
  }
}

console.log("Unikátních normalized jmen:", Object.keys(lookupMap).length);

// Kompaktní formát: [normalized, lat, lng, country]
const compact = Object.entries(lookupMap).map(([norm, c]) => [
  norm,
  Math.round(c.lat * 10000) / 10000,
  Math.round(c.lng * 10000) / 10000,
  c.country
]);

compact.sort((a, b) => a[0].localeCompare(b[0]));

const targetDir = path.dirname(OUTPUT);
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

fs.writeFileSync(OUTPUT, JSON.stringify(compact));
console.log("Uloženo do:", OUTPUT);
console.log("Velikost:", fs.statSync(OUTPUT).size, "B");

// Statistika kolik z toho je SK
const skCount = compact.filter(c => c[3] === "SK").length;
const czCount = compact.filter(c => c[3] === "CZ").length;
console.log("Z toho CZ:", czCount, " SK:", skCount);
