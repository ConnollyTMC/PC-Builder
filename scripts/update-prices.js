import fs from "fs";
import fetch from "node-fetch";

const dataFile = "./prices.json";
const timestampFile = "./lastRun.json";

// Insert your Best Buy Developer API Key here
const API_KEY = process.env.BESTBUY_API_KEY || "kT5jvtDTyDi85viJ9rxfN0e0";

// Delay helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Load last run timestamp
let lastRun = 0;
if (fs.existsSync(timestampFile)) {
  try {
    const tsData = JSON.parse(fs.readFileSync(timestampFile, "utf8"));
    lastRun = tsData.lastRun || 0;
  } catch (err) {
    console.log("Failed to read last run timestamp, will proceed with update.");
  }
}

// Check if 24 hours have passed
const now = Date.now();
const twentyFourHours = 24 * 60 * 60 * 1000;

if (now - lastRun < twentyFourHours) {
  console.log("Prices were updated less than 24 hours ago. Exiting.");
  process.exit(0);
}

// Load price data
const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));

// Fetch price from Best Buy API for a SKU
const fetchPrice = async (item) => {
  const url = `https://api.bestbuy.com/v1/products(sku=${item.sku})?apiKey=${API_KEY}&format=json`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();

    if (!json.products || json.products.length === 0) {
      console.log(`❌ SKU ${item.sku} (${item.name}): Not found, keeping prior price $${item.price}`);
      return;
    }

    // Use customerPrice if available, else salePrice
    const product = json.products[0];
    const price = product.customerPrice?.value || product.salePrice;

    if (price != null) {
      console.log(`✅ SKU ${item.sku} (${item.name}) updated: $${price}`);
      item.price = price;
    } else {
      console.log(`⚠ SKU ${item.sku} (${item.name}): No price found, keeping prior price $${item.price}`);
    }
  } catch (err) {
    console.log(`❌ SKU ${item.sku} (${item.name}) failed: ${err.message}, keeping prior price $${item.price}`);
  }
};

// Update a category
const updateCategory = async (category) => {
  console.log(`\nUpdating category: ${category}`);
  for (const item of data[category]) {
    await fetchPrice(item);
    await delay(1000); // 1s delay to avoid throttling
  }
};

// Update all categories
const updatePrices = async () => {
  for (const category of Object.keys(data)) {
    await updateCategory(category);
  }

  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  fs.writeFileSync(timestampFile, JSON.stringify({ lastRun: Date.now() }));
  console.log("\nAll prices updated!");
};

updatePrices();
