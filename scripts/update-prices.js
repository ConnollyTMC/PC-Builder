// scripts/update-prices.js
import fs from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.BESTBUY_API_KEY;
if (!API_KEY) {
  console.error("Missing BESTBUY_API_KEY env var.");
  process.exit(1);
}

const CATALOG_PATH = process.env.CATALOG_PATH || "catalog.json";
const ABS_PATH = path.resolve(CATALOG_PATH);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );

async function getJson(url, attempt = 0) {
  const res = await fetch(url);
  if (res.status === 429 && attempt < 5) {
    await sleep(1000 * (attempt + 1));
    return getJson(url, attempt + 1);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

async function fetchPricesForSkus(skus) {
  const filter = `(sku in(${skus.join(",")}))`;
  const base = "https://api.bestbuy.com/v1/products";
  const show = "sku,name,salePrice,regularPrice";
  const url = `${base}${encodeURI(filter)}?apiKey=${API_KEY}&format=json&show=${encodeURIComponent(show)}`;

  const data = await getJson(url);
  const map = new Map();
  for (const p of data.products ?? []) {
    const current =
      typeof p.salePrice === "number"
        ? p.salePrice
        : typeof p.regularPrice === "number"
        ? p.regularPrice
        : undefined;
    if (current !== undefined) map.set(String(p.sku), { price: current, name: p.name });
  }
  return map;
}

function collectAllSkus(catalog) {
  const allArrays = Object.values(catalog).filter(Array.isArray);
  const skus = new Set();
  for (const arr of allArrays) {
    for (const item of arr) {
      const s = String(item.sku ?? "").trim();
      if (/^\d+$/.test(s) && s !== "0") skus.add(s);
    }
  }
  return Array.from(skus);
}

async function main() {
  const raw = await fs.readFile(ABS_PATH, "utf8");
  const catalog = JSON.parse(raw);

  const allSkus = collectAllSkus(catalog);
  if (!allSkus.length) {
    console.log("No SKUs found.");
    return;
  }

  const CHUNK_SIZE = 50;
  const chunks = chunk(allSkus, CHUNK_SIZE);

  const priceMap = new Map();
  for (const c of chunks) {
    const map = await fetchPricesForSkus(c);
    for (const [sku, val] of map.entries()) priceMap.set(sku, val);
    await sleep(150);
  }

  const updateItem = (item) => {
    const hit = priceMap.get(String(item.sku));
    if (hit && typeof hit.price === "number") {
      item.price = hit.price;
    }
  };

  for (const key of Object.keys(catalog)) {
    if (Array.isArray(catalog[key])) {
      catalog[key].forEach(updateItem);
    }
  }

  await fs.writeFile(ABS_PATH, JSON.stringify(catalog, null, 2) + "\n");
  console.log(`Updated prices for ${priceMap.size} SKUs → ${CATALOG_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
