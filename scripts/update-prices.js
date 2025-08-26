import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const PRICES_FILE = path.resolve('./prices.json');

const fetchPrice = async (item) => {
  try {
    const url = `https://www.bestbuy.com/site/${item.sku}.p?skuId=${item.sku}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();

    // Try to find all possible price fields
    const currentMatch = html.match(/"currentPrice":([0-9.]+)/);
    const saleMatch = html.match(/"salePrice":([0-9.]+)/);
    const regularMatch = html.match(/"regularPrice":([0-9.]+)/);

    // Parse numbers if they exist
    const prices = [];
    if (currentMatch) prices.push(parseFloat(currentMatch[1]));
    if (saleMatch) prices.push(parseFloat(saleMatch[1]));
    if (regularMatch) prices.push(parseFloat(regularMatch[1]));

    if (prices.length > 0) {
      const highestPrice = Math.max(...prices);
      console.log(`Updating ${item.name} from $${item.price} to $${highestPrice}`);
      item.price = highestPrice;
    } else {
      console.log(`Price not found for ${item.name}, keeping previous: $${item.price}`);
    }

  } catch (err) {
    console.log(`Error fetching SKU ${item.sku}:`, err.message);
    console.log(`Keeping previous price for ${item.name}: $${item.price}`);
  }
};


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
