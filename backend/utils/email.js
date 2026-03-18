const { Resend } = require('resend');

let _resend;
const getResend = () => {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
};

const FROM = `${process.env.FROM_NAME || 'AceNursing'} <${process.env.FROM_EMAIL || 'supportacenursing@gmail.com'}>`;

// Retry helper — exponential backoff, up to 3 attempts
async function sendWithRetry(payload, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await getResend().emails.send(payload);
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 500 * 2 ** i)); // 500ms, 1s, 2s
    }
  }
}
// ─── HTML Template Wrapper ────────────────────────────────────────────────────
const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>AceNursing</title>
<style>
  body { margin: 0; padding: 0; background: #F5F4F0; font-family: 'DM Sans', -apple-system, sans-serif; }
  .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #0C1B33, #152540); padding: 32px; text-align: center; }
  .header-logo { font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
  .header-logo span { color: #C49A3C; }
  .header-tagline { color: rgba(255,255,255,0.6); font-size: 13px; margin-top: 6px; }
  .body { padding: 36px 32px; }
  h1 { font-size: 26px; color: #0C1B33; margin: 0 0 8px; font-weight: 700; }
  h2 { font-size: 18px; color: #0C1B33; margin: 24px 0 12px; font-weight: 600; }
  p { font-size: 15px; color: #555; line-height: 1.7; margin: 0 0 16px; }
  .product-row { display: flex; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid #EEE; }
  .product-emoji { font-size: 28px; width: 48px; text-align: center; }
  .product-info { flex: 1; }
  .product-name { font-size: 14px; font-weight: 600; color: #0C1B33; }
  .product-qty { font-size: 12px; color: #999; margin-top: 2px; }
  .product-price { font-size: 14px; font-weight: 700; color: #0C1B33; }
  .btn { display: inline-block; background: #0C1B33; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 600; margin: 8px 4px; }
  .btn-gold { background: #C49A3C; }
  .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #666; }
  .total-final { font-size: 18px; font-weight: 700; color: #0C1B33; }
  .badge { display: inline-block; background: #D1FAE5; color: #065F46; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
  .footer { padding: 24px 32px; background: #F8F7F3; text-align: center; }
  .footer p { font-size: 12px; color: #999; margin: 0; }
  .divider { height: 1px; background: #EEE; margin: 20px 0; }
  .info-box { background: #EBF5EE; border-left: 4px solid #059669; border-radius: 8px; padding: 14px 16px; margin: 16px 0; }
  .info-box p { color: #065F46; font-size: 14px; margin: 0; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <div class="header-logo">Ace<span>Nursing</span></div>
      <div class="header-tagline">Premium Nursing Study Materials</div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} AceNursing · <a href="https://acenursing.com/support" style="color:#999">Support</a> · <a href="https://acenursing.com/refunds" style="color:#999">Refund Policy</a></p>
      <p style="margin-top:6px">If you have questions, reply to this email or contact supportacenursing@gmail.com</p>
    </div>
  </div>
</div>
</body>
</html>
`;

// ─── Email: Order Confirmation + Download Links ───────────────────────────────
exports.sendOrderConfirmation = async ({ order, downloadLinks }) => {
  const itemsHtml = order.items
    .map(
      (item) => `
    <div class="product-row">
      <div class="product-emoji">${item.emoji || '📘'}</div>
      <div class="product-info">
        <div class="product-name">${item.title}</div>
        <div class="product-qty">Qty: ${item.quantity}</div>
      </div>
      <div class="product-price">$${(item.price * item.quantity).toFixed(2)}</div>
    </div>`
    )
    .join('');

  const downloadLinksHtml = downloadLinks
    .map(
      (link) => `
    <div style="padding: 14px; background: #F5F9FF; border-radius: 10px; margin-bottom: 10px;">
      <div style="font-size: 14px; font-weight: 600; color: #0C1B33; margin-bottom: 8px;">${link.title}</div>
      <a href="${link.url}" class="btn btn-gold" style="font-size: 13px; padding: 10px 20px;">⬇ Download Now</a>
      <div style="font-size: 11px; color: #999; margin-top: 8px;">Link expires: ${new Date(link.expiry).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>`
    )
    .join('');

  const content = `
    <span class="badge">✓ Payment Confirmed</span>
    <h1 style="margin-top: 16px;">Your Order is Ready!</h1>
    <p>Hi ${order.customerInfo.firstName}, thank you for your purchase! Your study materials are ready to download below.</p>

    <div class="info-box">
      <p>📧 Order #${order.orderNumber} · Paid $${order.total.toFixed(2)} via ${order.payment.method === 'paypal' ? 'PayPal' : 'Card'}</p>
    </div>

    <h2>Your Materials</h2>
    ${itemsHtml}

    <div class="divider"></div>

    <div style="text-align: right; padding: 8px 0;">
      <div class="total-row"><span>Subtotal</span><span>$${order.subtotal.toFixed(2)}</span></div>
      <div class="total-row total-final"><span>Total Paid</span><span>$${order.total.toFixed(2)}</span></div>
    </div>

    <div class="divider"></div>

    <h2>📥 Download Your Files</h2>
    <p style="font-size:13px; color:#999;">Download links are valid for 30 days. Each link can be used multiple times within that period.</p>
    ${downloadLinksHtml}

    <p style="margin-top: 24px; font-size: 13px; color: #999;">Having issues downloading? Contact us at supportacenursing@gmail.com and we'll help immediately.</p>
  `;

  return sendWithRetry({
    from: FROM,
    to: order.customerInfo.email,
    subject: `✅ Your AceNursing Materials Are Ready – Order #${order.orderNumber}`,
    html: emailWrapper(content),
  });
};

// ─── Email: Welcome / Registration ────────────────────────────────────────────
exports.sendWelcomeEmail = async ({ user }) => {
  const content = `
    <h1>Welcome to AceNursing! 🎓</h1>
    <p>Hi ${user.firstName}, your account has been created successfully.</p>
    <p>You now have access to your purchase history, instant re-downloads, and exclusive member discounts.</p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${process.env.FRONTEND_URL}/shop" class="btn">Browse Study Materials →</a>
    </div>
    <p style="font-size: 13px; color: #999;">Your account email: ${user.email}</p>
  `;

  return sendWithRetry({
    from: FROM,
    to: user.email,
    subject: `Welcome to AceNursing, ${user.firstName}! 🎓`,
    html: emailWrapper(content),
  });
};

// ─── Email: Password Reset ────────────────────────────────────────────────────
exports.sendPasswordResetEmail = async ({ user, resetUrl }) => {
  const content = `
    <h1>Reset Your Password</h1>
    <p>Hi ${user.firstName}, we received a request to reset your AceNursing password.</p>
    <p>Click the button below to set a new password. This link expires in <strong>10 minutes</strong>.</p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <div class="info-box">
      <p>⚠️ If you didn't request this, you can safely ignore this email. Your password will not change.</p>
    </div>
    <p style="font-size: 12px; color: #999;">Link: ${resetUrl}</p>
  `;

  return sendWithRetry({
    from: FROM,
    to: user.email,
    subject: 'Reset Your AceNursing Password',
    html: emailWrapper(content),
  });
};

// ─── Email: Admin – New Order Alert ───────────────────────────────────────────
exports.sendAdminOrderAlert = async ({ order }) => {
  if (!process.env.ADMIN_EMAIL) return;

  const content = `
    <h1>New Order Received 💰</h1>
    <p><strong>Order:</strong> #${order.orderNumber}</p>
    <p><strong>Customer:</strong> ${order.customerInfo.firstName} ${order.customerInfo.lastName} (${order.customerInfo.email})</p>
    <p><strong>Total:</strong> $${order.total.toFixed(2)} via ${order.payment.method}</p>
    <p><strong>Items:</strong> ${order.items.map(i => `${i.title} ×${i.quantity}`).join(', ')}</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${process.env.FRONTEND_URL}/admin/orders/${order._id}" class="btn">View in Admin →</a>
    </div>
  `;

  return sendWithRetry({
    from: FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `New Order #${order.orderNumber} – $${order.total.toFixed(2)}`,
    html: emailWrapper(content),
  });
};

// ─── Email: Custom Order – User Confirmation ──────────────────────────────────
exports.sendCustomOrderConfirmation = async ({ order }) => {
  const content = `
    <span class="badge" style="background:#DBEAFE;color:#1E40AF">📝 Request Received</span>
    <h1 style="margin-top:16px">We've received your assignment request!</h1>
    <p>Hi ${order.customerInfo.firstName}, thank you for submitting your custom assignment request. Our team will review it and send you a quote within <strong>24 hours</strong>.</p>
    <div class="info-box">
      <p>📋 Request #${order.orderNumber} · ${order.assignmentType} — "${order.subject}"</p>
    </div>
    <h2>Your Request Details</h2>
    <table style="width:100%;font-size:14px;color:#555;border-collapse:collapse">
      <tr><td style="padding:6px 0;color:#999;width:140px">Subject</td><td style="font-weight:600;color:#0C1B33">${order.subject}</td></tr>
      <tr><td style="padding:6px 0;color:#999">Type</td><td style="font-weight:600;color:#0C1B33">${order.assignmentType}</td></tr>
      <tr><td style="padding:6px 0;color:#999">Pages</td><td style="font-weight:600;color:#0C1B33">${order.pages || 'Not specified'}</td></tr>
      <tr><td style="padding:6px 0;color:#999">Deadline</td><td style="font-weight:600;color:#0C1B33">${new Date(order.deadline).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</td></tr>
      <tr><td style="padding:6px 0;color:#999">Academic Level</td><td style="font-weight:600;color:#0C1B33">${order.academicLevel}</td></tr>
      <tr><td style="padding:6px 0;color:#999">Citation Style</td><td style="font-weight:600;color:#0C1B33">${order.citationStyle}</td></tr>
    </table>
    ${order.attachmentNotes ? `<div class="info-box" style="background:#FEF3C7;border-color:#F59E0B"><p style="color:#92400E">📎 Attachment notes: ${order.attachmentNotes}</p></div>` : ''}
    <p style="margin-top:20px">You'll receive an email with our quote shortly. You can also track your request in your <a href="${process.env.FRONTEND_URL}/account" style="color:#0C1B33;font-weight:600">account dashboard</a>.</p>
    <p style="font-size:13px;color:#999">Questions? Reply to this email or contact supportacenursing@gmail.com</p>
  `;
  return sendWithRetry({
    from: FROM,
    to: order.customerInfo.email,
    subject: `✅ Assignment Request Received — #${order.orderNumber}`,
    html: emailWrapper(content),
  });
};

// ─── Email: Custom Order – Admin Alert ───────────────────────────────────────
exports.sendCustomOrderAdminAlert = async ({ order }) => {
  if (!process.env.ADMIN_EMAIL) return;
  const content = `
    <h1>New Custom Assignment Request 📝</h1>
    <p><strong>From:</strong> ${order.customerInfo.firstName} ${order.customerInfo.lastName} (${order.customerInfo.email})</p>
    <p><strong>Request #:</strong> ${order.orderNumber}</p>
    <p><strong>Subject:</strong> ${order.subject}</p>
    <p><strong>Type:</strong> ${order.assignmentType} · ${order.pages || '?'} pages · ${order.academicLevel}</p>
    <p><strong>Deadline:</strong> ${new Date(order.deadline).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
    <p><strong>Requirements:</strong></p>
    <div style="background:#F5F5F5;border-radius:8px;padding:14px;font-size:14px;color:#333;white-space:pre-wrap">${order.requirements}</div>
    ${order.attachmentNotes ? `<p style="margin-top:12px"><strong>Attachment notes:</strong> ${order.attachmentNotes}</p>` : ''}
    <div style="text-align:center;margin:28px 0">
      <a href="${process.env.FRONTEND_URL}/admin/custom-orders" class="btn">Review &amp; Send Quote →</a>
    </div>
  `;
  return sendWithRetry({
    from: FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `New Assignment Request #${order.orderNumber} — ${order.subject}`,
    html: emailWrapper(content),
  });
};

// ─── Email: Custom Order – Quote to User ─────────────────────────────────────
exports.sendCustomOrderQuote = async ({ order }) => {
  const { price, daysToComplete, adminNotes, expiresAt } = order.quote;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysToComplete);
  const content = `
    <span class="badge" style="background:#FEF3C7;color:#92400E">💰 Quote Ready</span>
    <h1 style="margin-top:16px">Your Assignment Quote is Ready</h1>
    <p>Hi ${order.customerInfo.firstName}, we've reviewed your request and prepared a quote for you.</p>
    <div style="background:#F0F6FF;border:2px solid #C0D4F0;border-radius:14px;padding:24px;margin:20px 0;text-align:center">
      <div style="font-size:13px;color:#666;margin-bottom:6px">Quoted Price</div>
      <div style="font-size:42px;font-weight:800;color:#0C1B33">$${price.toFixed(2)}</div>
      <div style="font-size:14px;color:#666;margin-top:8px">⏱ Delivery in <strong>${daysToComplete} day(s)</strong> after acceptance</div>
      <div style="font-size:13px;color:#999;margin-top:4px">Estimated delivery: ${dueDate.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>
    </div>
    ${adminNotes ? `<div class="info-box"><p>📝 Notes from our team: ${adminNotes}</p></div>` : ''}
    <p style="color:#DC2626;font-size:13px">⚠️ This quote expires on ${new Date(expiresAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})}. Please respond before then.</p>
    <div style="text-align:center;margin:28px 0;display:flex;gap:12px;justify-content:center">
      <a href="${process.env.FRONTEND_URL}/account" class="btn btn-gold">✅ Accept Quote</a>
      <a href="${process.env.FRONTEND_URL}/account" class="btn" style="background:#EEE;color:#333">❌ Decline</a>
    </div>
    <p style="font-size:13px;color:#999">Log in to your account to accept or decline this quote. Request #${order.orderNumber}</p>
  `;
  return sendWithRetry({
    from: FROM,
    to: order.customerInfo.email,
    subject: `💰 Your Quote is Ready — #${order.orderNumber} ($${price.toFixed(2)})`,
    html: emailWrapper(content),
  });
};

// ─── Email: Custom Order – Accepted Confirmation ──────────────────────────────
exports.sendCustomOrderAccepted = async ({ order }) => {
  const content = `
    <span class="badge">✅ Order Confirmed</span>
    <h1 style="margin-top:16px">Assignment Accepted — Work Begins Now!</h1>
    <p>Hi ${order.customerInfo.firstName}, you've accepted the quote for your assignment. Our team will begin working on it immediately.</p>
    <div class="info-box">
      <p>📋 #${order.orderNumber} · $${order.quote.price.toFixed(2)} · Due: ${new Date(order.delivery.dueAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
    </div>
    <p>You'll receive a notification and email when your assignment is delivered. You can track progress in your <a href="${process.env.FRONTEND_URL}/account" style="color:#0C1B33;font-weight:600">account dashboard</a>.</p>
    <p style="font-size:13px;color:#999">Need to share files? Reply to this email with your attachments.</p>
  `;
  return sendWithRetry({
    from: FROM,
    to: order.customerInfo.email,
    subject: `✅ Assignment Confirmed — #${order.orderNumber}`,
    html: emailWrapper(content),
  });
};

// ─── Email: Custom Order – Delivered ─────────────────────────────────────────
exports.sendCustomOrderDelivered = async ({ order }) => {
  const payUrl = `${process.env.FRONTEND_URL}/custom-order?pay=${order._id}`;
  const content = `
    <span class="badge" style="background:#D1FAE5;color:#065F46">🎉 Delivered</span>
    <h1 style="margin-top:16px">Your Assignment is Ready!</h1>
    <p>Hi ${order.customerInfo.firstName}, your assignment "${order.subject}" has been completed and is ready for download.</p>
    <div style="text-align:center;margin:28px 0">
      <a href="${payUrl}" class="btn btn-gold">💳 Pay &amp; Download Assignment</a>
    </div>
    <div class="info-box">
      <p>📋 Request #${order.orderNumber} · Delivered ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
    </div>
    <p>Click the button above to complete payment and unlock your download. If you need any revisions, log in to your <a href="${process.env.FRONTEND_URL}/custom-order" style="color:#0C1B33;font-weight:600">orders page</a> and request a revision within 7 days.</p>
    <p style="font-size:13px;color:#999">Satisfied? We'd love a review! Reply to this email with your feedback.</p>
  `;
  return sendWithRetry({
    from: FROM,
    to: order.customerInfo.email,
    subject: `🎉 Your Assignment is Delivered — #${order.orderNumber}`,
    html: emailWrapper(content),
  });
};
