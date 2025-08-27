const $ = id => document.getElementById(id);

function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function setCart(c) {
  localStorage.setItem("cart", JSON.stringify(c || []));
}

// Render cart summary on checkout page
function renderCartSummary() {
  const cart = getCart();
  const summary = $("cartSummary");
  summary.innerHTML = "";
  let total = 0;

  if (!cart.length) {
    summary.innerHTML = "<p>Your cart is empty.</p>";
    return 0;
  }

  cart.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "configCard";
    div.innerHTML = `<h4>Configuration ${i + 1}</h4>`;
    for (const [k, v] of Object.entries(c)) {
      if (k === "estTotal") continue;
      div.innerHTML += `<div>${k}: ${v || "—"}</div>`;
    }
    div.innerHTML += `<div>Subtotal: ${c.estTotal || "$0"}</div>`;
    summary.appendChild(div);

    total += parseFloat((c.estTotal || "0").replace(/[^\d.]/g, "")) || 0;
  });

  $("cartTotal").textContent = "$" + total.toFixed(2);
  return total.toFixed(2);
}

// Generate fallback order number
function generateFallbackOrderId() {
  return "ORDER-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
}

document.addEventListener("DOMContentLoaded", () => {
  const total = renderCartSummary();

  $("backCartBtn").addEventListener("click", () => {
    window.location.href = "cart.html";
  });

  paypal.Buttons({
    createOrder: function(data, actions) {
      // Validate form before creating order
      const fullName = $("#fullName").value.trim();
      const email = $("#email").value.trim();
      const phone = $("#phone").value.trim();
      const address = $("#address").value.trim();

      if (!fullName || !email || !phone || !address) {
        alert("Please fill out all required fields before payment.");
        return;
      }

      const cart = getCart();
      if (!cart.length) {
        alert("Your cart is empty.");
        return;
      }

      // Build items for PayPal
      let items = [];
      let sum = 0;
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
        sum += val;
        items.push({
          name: "Configuration " + (i + 1) + " Subtotal",
          unit_amount: { currency_code: "USD", value: val.toFixed(2) },
          quantity: "1"
        });
      });

      return actions.order.create({
        purchase_units: [{
          amount: {
            currency_code: "USD",
            value: sum.toFixed(2),
            breakdown: { item_total: { currency_code: "USD", value: sum.toFixed(2) } }
          },
          items: items
        }]
      });
    },
    onApprove: function(data, actions) {
      return actions.order.capture().then(details => {
        const orderId = details.id || generateFallbackOrderId();

        // Save full order info including customer form
        const orderInfo = {
          id: orderId,
          status: details.status,
          payerName: $("#fullName").value,
          payerEmail: $("#email").value,
          payerPhone: $("#phone").value,
          payerAddress: $("#address").value,
          amount: details.purchase_units[0].amount.value,
          items: details.purchase_units[0].items?.map(i => ({
            name: i.name,
            value: i.unit_amount.value
          })) || []
        };

        sessionStorage.setItem("lastOrder", JSON.stringify(orderInfo));

        // Clear cart
        localStorage.removeItem("cart");

        // Redirect to confirmation
        window.location.href = "order-confirmation.html";
      });
    },
    onError: function(err) {
      console.error(err);
      alert("Payment failed. Please try again.");
    }
  }).render("#paypal-button-container");
});
