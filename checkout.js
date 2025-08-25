const $ = id => document.getElementById(id);

function getCart(){ return JSON.parse(localStorage.getItem('cart')||'[]'); }
function setCart(c){ localStorage.setItem('cart', JSON.stringify(c||[])); }

function renderCheckout(){
  const cart = getCart(); const list = $('checkoutList'); list.innerHTML=''; let sum=0;
  if(!cart.length) list.innerHTML='<div class="empty">Your cart is empty.</div>';
  cart.forEach((c,i)=>{
    const div = document.createElement('div'); div.className='configCard';
    div.innerHTML = `<h3>Configuration ${i+1}</h3>`;
    for(const [k,v] of Object.entries(c)){ if(k==='estTotal') continue; div.innerHTML+=`<div class="partRow"><div class="label">${k}</div><div class="value">${v||'—'}</div></div>`; }
    div.innerHTML += `<div class="partRow"><div class="label">Subtotal</div><div class="price">${c.estTotal||'$0'}</div></div>`;
    list.appendChild(div);
    sum += parseFloat((c.estTotal||'0').replace(/[^\d.]/g,''))||0;
  });
  $('checkoutTotal').textContent='$'+sum.toLocaleString();
}

function clearCart(){ setCart([]); renderCheckout(); }

renderCheckout();
