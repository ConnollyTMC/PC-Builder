import fs from "fs";
import fetch from "node-fetch";

// Load the prices.json file
const dataFile = "./prices.json";
const data = JSON.parse(fs.readFileSync(dataFile, "utf-8"));

// Helper to fetch a single SKU price with timeout
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Fetch timeout")), timeout)
    ),
  ]);
};

// Fetch price for a single item
const fetchPrice = async (item) => {
  try {
    console.log(`Fetching price for ${item.name} (${item.sku})...`);

    const url = `https://www.bestbuy.com/site/${item.sku}.p?skuId=${item.sku}`;
    const res = await fetchWithTimeout(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();

    // Extract price fields from HTML
    const currentMatch = html.match(/"currentPrice":([0-9.]+)/);
    const saleMatch = html.match(/"salePrice":([0-9.]+)/);
    const regularMatch = html.match(/"regularPrice":([0-9.]+)/);

    const prices = [];
    if (currentMatch) prices.push(parseFloat(currentMatch[1]));
    if (saleMatch) prices.push(parseFloat(saleMatch[1]));
    if (regularMatch) prices.push(parseFloat(regularMatch[1]));

    if (prices.length > 0) {
      const highestPrice = Math.max(...prices);
      console.log(`  → Found prices: ${prices.join(", ")}, using highest: $${highestPrice}`);
      item.price = highestPrice;
    } else {
      console.log(`  → Price not found, keeping previous: $${item.price}`);
    }

  } catch (err) {
    console.log(`  → Error fetching SKU ${item.sku}: ${err.message}`);
    console.log(`  → Keeping previous price: $${item.price}`);
  }
};

// Update all items in a category
const updateCategory = async (category) => {
  for (const item of data[category]) {
    await fetchPrice(item);
  }
};

// Main function to update all categories
const updatePrices = async () => {
  const categories = Object.keys(data);
  for (const cat of categories) {
    console.log(`\nUpdating category: ${cat}`);
    await updateCategory(cat);
  }

  // Write updated prices back to file
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  console.log("\nAll prices updated and saved to prices.json!");
};

// Run the updater
updatePrices();
