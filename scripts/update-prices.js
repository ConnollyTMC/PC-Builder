import fs from "fs";
import fetch from "node-fetch";

// Load prices.json
const dataFile = "./prices.json";
const data = JSON.parse(fs.readFileSync(dataFile, "utf-8"));

// Helper: fetch JSON for a SKU from Best Buy API endpoint
const fetchSkuJson = async (sku) => {
  try {
    const url = `https://www.bestbuy.com/api/3.0/products/${sku}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.log(`  → Error fetching SKU ${sku}: ${err.message}`);
    return null;
  }
};

// Fetch price for a single item
const fetchPrice = async (item) => {
  console.log(`Fetching price for ${item.name} (${item.sku})...`);
  const skuJson = await fetchSkuJson(item.sku);
  if (!skuJson || !skuJson.skus) {
    console.log(`  → No data returned for SKU ${item.sku}, keeping previous price: $${item.price}`);
    return;
  }

  const skuData = skuJson.skus.find(s => s.skuId == item.sku);
  if (!skuData || !skuData.customerPrice) {
    console.log(`  → No customerPrice found for SKU ${item.sku}, keeping previous: $${item.price}`);
    return;
  }

  const price = skuData.customerPrice;
  console.log(`  → Found customerPrice: $${price}`);
  item.price = price;
};

// Update all items in a category
const updateCategory = async (category) => {
  for (const item of data[category]) {
    await fetchPrice(item);
  }
};

// Main updater
const updatePrices = async () => {
  const categories = Object.keys(data);
  for (const cat of categories) {
    console.log(`\nUpdating category: ${cat}`);
    await updateCategory(cat);
  }

  // Write back to file
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  console.log("\nAll prices updated and saved to prices.json!");
};

// Run the updater
updatePrices();
