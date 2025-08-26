import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const PRICES_FILE = path.resolve('./prices.json');

async function fetchPrice(sku) {
  // Replace this with a real Best Buy API endpoint if you have one.
  // This is a placeholder using the Best Buy website scraping approach.
  try {
    const res = await fetch(`https://api.bestbuy.com/v1/products(sku=${sku})?apiKey=YOUR_API_KEY&format=json`);
    const data = await res.json();
    return data.products[0]?.salePrice ?? 0;
  } catch (err) {
    console.error(`Error fetching SKU ${sku}:`, err);
    return 0;
  }
}

async function updateCategory(category) {
  for (const item of category) {
    const newPrice = await fetchPrice(item.sku);
    console.log(`Updating ${item.name} from $${item.price} to $${newPrice}`);
    item.price = newPrice;
  }
}

async function updatePrices() {
  const fileData = fs.readFileSync(PRICES_FILE, 'utf-8');
  const prices = JSON.parse(fileData);

  for (const key of Object.keys(prices)) {
    await updateCategory(prices[key]);
  }

  fs.writeFileSync(PRICES_FILE, JSON.stringify(prices, null, 2));
  console.log('All prices updated!');
}

updatePrices();
