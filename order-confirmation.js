const $ = id => document.getElementById(id);

function getOrderDetails() {
  return JSON.parse(sessionStorage.getItem("lastOrder") || "{}");
}

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
    <p><strong>Name:</strong> ${details.payerName}</p>
    <p><strong>Email:</strong> ${details.payerEmail}</p>
    <p><strong>Phone:</strong> ${details.payerPhone || "N/A"}</p>
    <p><strong>Address:</strong> ${details.payerAddress || "N/A"}</p>
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

  const itemsList = order.items.map(i => `${i.name} — $${i.value}`).join("\n");

  emailjs.send(
    "YOUR_SERVICE_ID",
    "YOUR_TEMPLATE_ID",
    {
      order_id: order.id,
      name: order.payerName,
      email: emailInput,
      phone: order.payerPhone || "",
      address: order.payerAddress || "",
      items: itemsList,
      total: order.amount
    },
    "YOUR_PUBLIC_KEY"
  ).then(
    () => {
      status.textContent = `Receipt sent to ${emailInput}!`;
      status.style.color = "green";
    },
    error => {
      console.error(error);
      status.textContent = "Failed to send receipt. Please try again.";
      status.style.color = "red";
    }
  );
}

function wire() {
  $("backHomeBtn").addEventListener("click", () => {
    window.location.href = "index.html";
  });

  $("sendReceiptBtn").addEventListener("click", sendReceipt);

  const details = getOrderDetails();
  if (details.payerEmail) $("receiptEmail").value = details.payerEmail;

  emailjs.init("YOUR_PUBLIC_KEY");
}

document.addEventListener("DOMContentLoaded", () => {
  renderConfirmation();
  wire();
});
