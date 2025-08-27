// --- Utility ---
const $ = id => document.getElementById(id);

// Get order info from sessionStorage
function getOrderDetails() {
  return JSON.parse(sessionStorage.getItem("lastOrder") || "{}");
}

// Render confirmation
function renderConfirmation() {
  const details = getOrderDetails();
  const box = $("confirmationDetails");

  if (!details.id) {
    box.innerHTML = `<p>We couldn't find your order details.</p>`;
    return;
  }

  let html = `
    <h2>Order #${details.id}</h2>
    <p><strong>Status:</strong> ${details.status}</p>
    <p><strong>Payer:</strong> ${details.payerName} (${details.payerEmail})</p>
    <p><strong>Total:</strong> $${details.amount}</p>
    <h3>Items</h3>
    <ul>
  `;

  if (details.items && details.items.length) {
    details.items.forEach(it => {
      html += `<li>${it.name} — $${it.value}</li>`;
    });
  }

  html += "</ul>";

  box.innerHTML = html;
}

// Simulate sending receipt
function sendReceipt() {
  const emailInput = $("receiptEmail").value.trim();
  const status = $("emailStatus");
  const order = getOrderDetails();

  if (!emailInput || !emailInput.includes("@")) {
    status.textContent = "Please enter a valid email address.";
    status.style.color = "red";
    return;
  }

  if (!order.id) {
    status.textContent = "No order details found.";
    status.style.color = "red";
    return;
  }

  // For now, just simulate success (replace this with actual email service)
  status.textContent = `Receipt sent to ${emailInput}!`;
  status.style.color = "green";
}

function wire() {
  $("backHomeBtn").addEventListener("click", () => {
    window.location.href = "index.html";
  });

  $("sendReceiptBtn").addEventListener("click", sendReceipt);
}

renderConfirmation();
wire();
