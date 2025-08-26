import fs from "fs";
import fetch from "node-fetch";

const dataFile = "./prices.json";
const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));

// Insert your Best Buy Developer API Key here
const API_KEY = process.env.BESTBUY_API_KEY || "kT5jvtDTyDi85viJ9rxfN0e0";

// Delay helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch price from Best Buy API for a SKU
const fetchPrice = async (item) => {
  const url = `https://api.bestbuy.com/v1/products(sku=${item.sku})?apiKey=${API_KEY}&format=json`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();

    if (!json.products || json.products.length === 0) {
      console.log(`❌ SKU ${item.sku} (${item.name}): Not found in API, URL: ${url}`);
      item.price = 0;
      return;
    }

    // Use customerPrice if available, else regular salePrice
    const product = json.products[0];
    const price =
      product.customerPrice?.value || product.salePrice || 0;

    console.log(`✅ SKU ${item.sku} (${item.name}) updated: $${price}`);
    item.price = price;
  } catch (err) {
    console.log(`❌ SKU ${item.sku} (${item.name}) failed: ${err.message}, URL: ${url}`);
    item.price = 0;
  }
};

// Update a category
const updateCategory = async (category) => {
  console.log(`\nUpdating category: ${category}`);
  for (const item of data[category]) {
    await fetchPrice(item);
    await delay(200); // 0.2s delay to avoid throttling
  }
};

// Update all categories
const updatePrices = async () => {
  for (const category of Object.keys(data)) {
    await updateCategory(category);
  }

  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  console.log("\nAll prices updated!");
};

updatePrices();
