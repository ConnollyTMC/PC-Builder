const $ = id => document.getElementById(id);
let LISTS = {};              // current filtered lists
let ORIGINAL_LISTS = {};     // keep unfiltered copy

async function fetchData() {
  const resp = await fetch('prices.json');
  const data = await resp.json();
  ORIGINAL_LISTS = data;
  LISTS = JSON.parse(JSON.stringify(data)); // deep copy
  populateAll();
}

// Option element for select
function optionFor(item) {
  const opt = document.createElement('option');
  opt.value = item.sku || item.name;
  opt.textContent = `${item.name} — $${item.price}`;
  return opt;
}

// Populate a <select> element
function populateSelect(id, list) {
  const el = $(id);
  el.innerHTML = '';
  list.forEach(it => el.appendChild(optionFor(it)));
  if (el.options.length) el.selectedIndex = 0;
}

// Populate all selects
function populateAll() {
  populateSelect('Case', LISTS.cases);
  populateSelect('Motherboard', LISTS.motherboards);
  populateSelect('Computer Processor (CPU)', LISTS.cpus);
  populateSelect('CPU Cooler', LISTS.coolers);
  populateSelect('Graphics Card (GPU)', LISTS.gpus);
  populateSelect('Memory (RAM)', LISTS.ram);
  populateSelect('Power Supply (PSU)', LISTS.psu);
  populateSelect('Storage', LISTS.storage);
  populateSelect('Storage 2', LISTS.storage);
  populateSelect('Storage 3', LISTS.storage);
  updateCaseNote();
  updateFanPrice();
  calcTotal();
}

function selectedItem(sel, key) {
  return (LISTS[key]||[]).find(x => (x.sku||x.name) === $(sel).value);
}

function coolerBrand() {
  return (selectedItem('cooler','coolers')?.brand||'').toLowerCase().includes('thermaltake') ? 'Thermaltake' : 'NZXT';
}

function updateCaseNote() {
  const item = selectedItem('case','cases');
  const cap = item?.maxFanSlots ?? '—';
  $('fanCap').textContent = cap;
  const n = Math.max(0, parseInt($('fanCount').value) || 0);
  if(Number.isFinite(cap)) $('fanCount').max = cap;
}

// Get per-fan price from brand
function updateFanPrice() {
  const brand = coolerBrand();
  let price = 0;
  if (brand === 'NZXT') price = 15;
  if (brand === 'thermaltake') price = 17;
  $('fanPrice').textContent = `$${price}`;
  return price;
}

// Calculate total dynamically
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
  const qty = Math.max(0, parseInt($('fanCount').value) || 0);
  const sum = parts.reduce((a,b)=>a+b,0) + qty*updateFanPrice();
  $('total').textContent = `$${sum.toLocaleString()}`;
}

// Cart helpers
function getCart() { return JSON.parse(localStorage.getItem("cart")||"[]"); }
function setCart(c) { localStorage.setItem("cart", JSON.stringify(c||[])); }

// Color filter without mutating original lists
function filterByColor(color) {
  LISTS = {};
  for(let k in ORIGINAL_LISTS){
    if(Array.isArray(ORIGINAL_LISTS[k])){
      LISTS[k] = ORIGINAL_LISTS[k].filter(item=>{
        if(!item.color || color==='all') return true;
        return (Array.isArray(item.color)?item.color:[item.color]).includes(color.toLowerCase());
      });
    } else {
      LISTS[k] = ORIGINAL_LISTS[k];
    }
  }
  populateAll();
}

// Wire up event listeners
function wire() {
  // update total on change
  document.querySelectorAll('select,input').forEach(el=>{
    el.addEventListener('change', ()=>{ updateCaseNote(); calcTotal(); });
    el.addEventListener('keyup', ()=>{ updateCaseNote(); calcTotal(); });
  });

  // color filter
  $('colorFilter').addEventListener('change', ()=>{ filterByColor($('colorFilter').value); });

  // add to cart
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

  // view cart
  $('viewCartBtn').addEventListener('click', ()=>{ window.location.href='cart.html'; });
}

async function init() { await fetchData(); wire(); }
init();
