import fs from "fs";
import fetch from "node-fetch";

// Load your prices.json
const dataFile = "./prices.json";
const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));

// Helper: fetch HTML and extract price
const fetchPrice = async (item) => {
  const url = `https://www.bestbuy.com/site/${item.sku}.p`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      },
      timeout: 10000, // 10s timeout
    });

    const html = await res.text();

    // Find JSON inside <script type="application/ld+json"> or other known script
    const match = html.match(/"customerPrice":\s*({[^}]+})/);
    if (!match) {
      console.log(`❌ SKU ${item.sku}: price not found`);
      return;
    }

    const priceObj = JSON.parse(match[1]);
    const price = priceObj.value || 0;

    console.log(`✅ SKU ${item.sku} (${item.name}) updated: $${price}`);
    item.price = price;
  } catch (err) {
    console.log(`❌ SKU ${item.sku} (${item.name}) failed: ${err.message}`);
    item.price = 0; // fallback
  }
};

// Update a category
const updateCategory = async (category) => {
  for (const item of data[category]) {
    await fetchPrice(item);
  }
};

// Update all categories
const updatePrices = async () => {
  for (const category of Object.keys(data)) {
    console.log(`\nUpdating category: ${category}`);
    await updateCategory(category);
  }

  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  console.log("\nAll prices updated!");
};

updatePrices();
