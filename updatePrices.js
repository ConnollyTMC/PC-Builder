const fs = require("fs");
const bby = require("bestbuy")(process.env.BESTBUY_API_KEY);

// Load your price data
let data = JSON.parse(fs.readFileSync("prices.json", "utf-8"));

async function updateCategory(category) {
  for (const item of data[category]) {
    try {
      const response = await bby.products(item.sku, { format: "json" });
      if (response.products && response.products.length > 0) {
        item.price = response.products[0].salePrice;
        console.log(`Updated ${item.name} (SKU: ${item.sku}) → $${item.price}`);
      }
    } catch (err) {
      console.error("Error fetching SKU", item.sku, err.message);
    }
  }
}

async function updateAll() {
  for (const category of Object.keys(data)) {
    await updateCategory(category);
  }
  fs.writeFileSync("prices.json", JSON.stringify(data, null, 2));
}

updateAll();
