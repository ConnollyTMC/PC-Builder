import fs from "fs";
import fetch from "node-fetch";

// Load your prices.json
const dataFile = "./prices.json";
const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));

// Delay helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch with timeout and detailed logging
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  options.signal = controller.signal;

  try {
    return await fetch(url, options);
  } catch (err) {
    if (err.name === "AbortError") {
      console.log(`⏱️ Fetch aborted (timeout) for URL: ${url}`);
    } else {
      console.log(`❌ Fetch failed for URL: ${url} - ${err.message}`);
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
};

// Fetch price for a SKU
const fetchPrice = async (item) => {
  const url = `https://www.bestbuy.com/site/product/${item.sku}.p?skuId=${item.sku}`;

  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      },
    });

    const html = await res.text();

    // Extract the JSON containing customerPrice
    const match = html.match(/"customerPrice":\s*({[^}]+})/);
    if (!match) {
      console.log(`❌ SKU ${item.sku} (${item.name}): price not found, URL: ${url}`);
      item.price = 0;
      return;
    }

    const priceObj = JSON.parse(match[1]);
    const price = priceObj.value || 0;

    console.log(`✅ SKU ${item.sku} (${item.name}) updated: $${price}`);
    item.price = price;
  } catch (err) {
    if (err.name !== "AbortError") {
      console.log(`❌ SKU ${item.sku} (${item.name}) failed: ${err.message}, URL: ${url}`);
    }
    item.price = 0;
  }
};

// Update a category
const updateCategory = async (category) => {
  console.log(`\nUpdating category: ${category}`);
  for (const item of data[category]) {
    await fetchPrice(item);
    await delay(500); // 0.5s delay between requests
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
