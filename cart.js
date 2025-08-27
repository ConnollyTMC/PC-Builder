<script>
const $ = id => document.getElementById(id);

function getCart(){return JSON.parse(localStorage.getItem('cart')||'[]');}
function setCart(c){localStorage.setItem('cart', JSON.stringify(c||[]));}

function renderCart(){
  const cart = getCart();
  const list = $('cartList');
  list.innerHTML = '';
  let sum = 0;
  if(!cart.length) {
    list.innerHTML = '<div class="empty">Your cart is empty.</div>';
    $('cartTotal').textContent = '$0';
    return;
  }
  cart.forEach((c,i)=>{
    const div = document.createElement('div');
    div.className = 'configCard';
    div.innerHTML = `<h3>Configuration ${i+1}</h3>`;
    for(const [k,v] of Object.entries(c)){
      if(k==='estTotal') continue;
      div.innerHTML += `<div class="partRow"><div class="label">${k}</div><div class="value">${v||'—'}</div></div>`;
    }
    div.innerHTML += `<div class="partRow"><div class="label">Subtotal</div><div class="price">${c.estTotal||'$0'}</div></div>`;
    list.appendChild(div);
    const val = parseFloat((c.estTotal||'0').replace(/[^\d.]/g,''))||0;
    sum += val;
  });
  $('cartTotal').textContent = '$'+sum.toLocaleString();
}

function clearCart(){setCart([]); renderCart();}

function getCartTotal(){
  const cart = getCart();
  let total = 0;
  cart.forEach(c=>{
    total += parseFloat((c.estTotal||'0').replace(/[^\d.]/g,''))||0;
  });
  return total.toFixed(2);
}

function wire(){
  $('clearCartBtn').addEventListener('click', clearCart);
  $('viewBackBtn').addEventListener('click', ()=>{window.location.href='index.html';});

  // Replace checkout button with PayPal button container
  const checkoutBtn = $('viewCheckoutBtn');
const container = document.createElement('div');
container.id = 'paypal-button-container';
checkoutBtn.replaceWith(container);

paypal.Buttons({
  createOrder: function(data, actions) {
    const total = getCartTotal();
    if(total === '0') {
      alert('Your cart is empty.');
      return;
    }
    return actions.order.create({
      purchase_units: [{
        amount: { value: total },
        description: 'Custom PC Order'
      }]
    });
  },
  onApprove: function(data, actions) {
    return actions.order.capture().then(function(details) {
      alert('Payment completed by ' + details.payer.name.given_name);
      clearCart();
    });
  },
  onError: function(err) {
    console.error(err);
    alert('Payment failed. Please try again.');
  }
}).render('#paypal-button-container');

renderCart(); wire();
</script>
