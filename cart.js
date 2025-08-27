// --- Utility Helpers ---
const $ = id => document.getElementById(id);

function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function setCart(c) {
  localStorage.setItem("cart", JSON.stringify(c || []));
}

// --- Render Cart ---
function renderCart() {
  const cart = getCart();
  const list = $("cartList");
  list.innerHTML = "";
  let sum = 0;

  if (!cart.length) {
    list.innerHTML = '<div class="empty">Your cart is empty.</div>';
    $("cartTotal").textContent = "$0";
    return;
  }

  cart.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "configCard";
    div.innerHTML = `<h3>Configuration ${i + 1}</h3>`;

    for (const [k, v] of Object.entries(c)) {
      if (k === "estTotal") continue;
      div.innerHTML += `
        <div class="partRow">
          <div class="label">${k}</div>
          <div class="value">${v || "—"}</div>
        </div>`;
    }

    div.innerHTML += `
      <div class="partRow">
        <div class="label">Subtotal</div>
        <div class="price">${c.estTotal || "$0"}</div>
      </div>`;
    list.appendChild(div);

    const val = parseFloat((c.estTotal || "0").replace(/[^\d.]/g, "")) || 0;
    sum += val;
  });

  $("cartTotal").textContent = "$" + sum.toLocaleString();
}

// --- Clear Cart ---
function clearCart() {
  setCart([]);
  renderCart();
}

// --- Wire Buttons ---
function wire() {
  $("clearCartBtn").addEventListener("click", clearCart);
  $("viewBackBtn").addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

// --- Generate Fallback Order Number ---
function generateFallbackOrderId() {
  return "ORDER-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
}

// --- PayPal Buttons ---
paypal.Buttons({
  createOrder: function (data, actions) {
    const cart = getCart();
    if (!cart.length) {
      alert("Your cart is empty.");
      return;
    }

    let items = [];
    let total = 0;

    cart.forEach((c, i) => {
      for (const [k, v] of Object.entries(c)) {
        if (k === "estTotal" || !v) continue;

        items.push({
          name: k + ": " + v,
          unit_amount: { currency_code: "USD", value: "0.00" },
          quantity: "1"
        });
      }

      const val = parseFloat((c.estTotal || "0").replace(/[^\d.]/g, "")) || 0;
      total += val;

      items.push({
        name: "Configuration " + (i + 1) + " Subtotal",
        unit_amount: { currency_code: "USD", value: val.toFixed(2) },
        quantity: "1"
      });
    });

    return actions.order.create({
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: total.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: total.toFixed(2)
              }
            }
          },
          items: items
        }
      ]
    });
  },

  onApprove: function (data, actions) {
    return actions.order.capture().then(function (details) {
      // ✅ Use PayPal order ID if available, else fallback generator
      const orderId = details.id || generateFallbackOrderId();

      const orderInfo = {
        id: orderId,
        status: details.status || "COMPLETED",
        payerName: details.payer?.name
          ? details.payer.name.given_name + " " + details.payer.name.surname
          : "Unknown",
        payerEmail: details.payer?.email_address || "Not provided",
        amount: details.purchase_units?.[0]?.amount?.value || "0.00",
        items:
          details.purchase_units?.[0]?.items?.map(i => ({
            name: i.name,
            value: i.unit_amount.value
          })) || []
      };

      // Save order in sessionStorage
      sessionStorage.setItem("lastOrder", JSON.stringify(orderInfo));

      // ✅ Clear cart storage (no re-render!)
      localStorage.removeItem("cart");

      // ✅ Redirect directly to confirmation page
      window.location.href = "checkout.html";
    });
  },

  onError: function (err) {
    console.error(err);
    alert("Payment failed. Please try again.");
  }
}).render("#paypal-button-container");

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  wire();
});
