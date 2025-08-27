const $ = id => document.getElementById(id);

function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function renderCartSummary() {
  const cart = getCart();
  const tbody = document.querySelector("#cartSummary tbody");
  tbody.innerHTML = "";
  let total = 0;

  if (!cart.length) {
    tbody.innerHTML = '<tr><td colspan="4">Your cart is empty.</td></tr>';
    $("cartTotal").textContent = "$0";
    return 0;
  }

  cart.forEach((c, i) => {
    const configName = `Configuration ${i + 1}`;
    let configSubtotal = parseFloat((c.estTotal || "0").replace(/[^\d.]/g, "")) || 0;

    let firstPart = true;
    for (const [part, selection] of Object.entries(c)) {
      if (part === "estTotal") continue;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${configName}</td>
        <td>${part}</td>
        <td>${selection || "—"}</td>
        <td>${firstPart ? `$${configSubtotal.toFixed(2)}` : ""}</td>
      `;
      firstPart = false;
      tbody.appendChild(row);
    }

    total += configSubtotal;
  });

  $("cartTotal").textContent = "$" + total.toFixed(2);
  return total.toFixed(2);
}

function generateFallbackOrderId() {
  return "ORDER-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
}

document.addEventListener("DOMContentLoaded", () => {
  renderCartSummary();

  $("backCartBtn").addEventListener("click", () => {
    window.location.href = "cart.html";
  });

  paypal.Buttons({
  createOrder: function(data, actions) {
    // Get form values
    const fullName = $("#fullName").value.trim();
    const email = $("#email").value.trim();
    const phone = $("#phone").value.trim();
    const address = $("#address").value.trim();

    // Validation
    if (!fullName || !email || !phone || !address) {
      alert("Please fill out all required fields before payment.");
      return; // ⚠ Must return nothing to stop PayPal
    }

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
          name: `${k}: ${v}`,
          unit_amount: { currency_code: "USD", value: "0.00" }, 
          quantity: "1"
        });
      }
      const val = parseFloat((c.estTotal || "0").replace(/[^\d.]/g, "")) || 0;
      total += val;
      items.push({
        name: `Configuration ${i+1} Subtotal`,
        unit_amount: { currency_code: "USD", value: val.toFixed(2) },
        quantity: "1"
      });
    });

    // ⚠ Return the created order
    return actions.order.create({
      purchase_units: [{
        amount: {
          currency_code: "USD",
          value: total.toFixed(2),
          breakdown: {
            item_total: { currency_code: "USD", value: total.toFixed(2) }
          }
        },
        items: items
      }]
    });
  },
  onApprove: function(data, actions) {
    return actions.order.capture().then(details => {
      // Save order to sessionStorage and redirect
    });
  },
  onError: function(err) {
    console.error(err);
    alert("Payment failed. Please try again.");
  }
}).render("#paypal-button-container");
});
