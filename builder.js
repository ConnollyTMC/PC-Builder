const $ = id => document.getElementById(id);
let LISTS = {};
let FAN_PRICES = {}; // Store fan SKU prices

// Fetch prices.json
async function fetchData() {
  const resp = await fetch('prices.json');
  const data = await resp.json();
  LISTS = data;
  FAN_PRICES = {
    NZXT: 10,
    Thermaltake: 12
  };
  populateAll();
}

// Generate <option> element
function optionFor(item) {
  const opt = document.createElement('option');
  opt.value = item.sku || item.name;
  opt.textContent = `${item.name} — $${item.price}`;
  return opt;
}

// Populate <select>
function populateSelect(id, list) {
  const el = $(id);
  el.innerHTML = '';
  list.forEach(it => el.appendChild(optionFor(it)));
  if(el.options.length) el.selectedIndex = 0;
}

// Populate all selects
function populateAll() {
  populateSelect('case', LISTS.cases);
  populateSelect('motherboard', LISTS.motherboards);
  populateSelect('cpu', LISTS.cpus);
  populateSelect('cooler', LISTS.coolers);
  populateSelect('gpu', LISTS.gpus);
  populateSelect('ram', LISTS.ram);
  populateSelect('psu', LISTS.psu);
  populateSelect('storage1', LISTS.storage);
  populateSelect('storage2', LISTS.storage);
  updateCaseNote();
  updateFanPrice();
  calcTotal();
}

// Get selected item
function selectedItem(sel, key) { 
  return (LISTS[key]||[]).find(x => (x.sku||x.name) === $(sel).value); 
}

// Determine cooler brand for fan price
function coolerBrand() { 
  const brand = selectedItem('cooler','coolers')?.brand || '';
  return brand.toLowerCase().includes('thermaltake') ? 'Thermaltake' : 'NZXT'; 
}

// Update fan cap note
function updateCaseNote() {
  const item = selectedItem('case','cases');
  const cap = item?.maxFanSlots ?? '—';
  $('fanCap').textContent = cap;
  const n = Math.max(0,parseInt($('fanCount').value)||0);
  if(Number.isFinite(cap)) $('fanCount').max = cap;
}

// Update fan price
function updateFanPrice() {
  const price = FAN_PRICES[coolerBrand()] || 0;
  $('fanPrice').textContent = `$${price}`;
  return price;
}

// Calculate total
function calcTotal() {
  const parts = [
    selectedItem('case','cases')?.price || 0,
    selectedItem('motherboard','motherboards')?.price || 0,
    selectedItem('cpu','cpus')?.price || 0,
    selectedItem('cooler','coolers')?.price || 0,
    selectedItem('gpu','gpus')?.price || 0,
    selectedItem('ram','ram')?.price || 0,
    selectedItem('psu','psu')?.price || 0,
    selectedItem('storage1','storage')?.price || 0,
    selectedItem('storage2','storage')?.price || 0
  ];
  const qty = Math.max(0,parseInt($('fanCount').value)||0);
  const sum = parts.reduce((a,b)=>a+b,0) + qty*updateFanPrice();
  $('total').textContent = `$${sum.toLocaleString()}`;
}

// Cart localStorage
function getCart(){ return JSON.parse(localStorage.getItem("cart")||"[]"); }
function setCart(c){ localStorage.setItem("cart", JSON.stringify(c||[])); }

// Wire events
function wire() {
  document.querySelectorAll('select,input').forEach(el=>{
    el.addEventListener('change', ()=>{ updateCaseNote(); calcTotal(); });
  });
  $('addToCartBtn').addEventListener('click', ()=>{
    const payload = {
      case:selectedItem('case','cases')?.name,
      motherboard:selectedItem('motherboard','motherboards')?.name,
      cpu:selectedItem('cpu','cpus')?.name,
      cooler:selectedItem('cooler','coolers')?.name,
      gpu:selectedItem('gpu','gpus')?.name,
      ram:selectedItem('ram','ram')?.name,
      psu:selectedItem('psu','psu')?.name,
      storage1:selectedItem('storage1','storage')?.name,
      storage2:selectedItem('storage2','storage')?.name,
      extraFans: Math.max(0,parseInt($('fanCount').value)||0),
      estTotal: $('total').textContent
    };
    const cart = getCart(); cart.push(payload); setCart(cart);
    $('cartMsg').textContent = `✅ Added to cart: ${payload.estTotal}`;
  });
  $('viewCartBtn').addEventListener('click', ()=>{ window.location.href='cart.html'; });
}

async function init() { await fetchData(); wire(); }
init();
