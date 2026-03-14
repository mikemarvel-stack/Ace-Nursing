const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = `${process.env.FROM_NAME || 'AceNursing'} <${process.env.FROM_EMAIL || 'orders@acenursing.com'}>`;

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
      <p style="margin-top:6px">If you have questions, reply to this email or contact support@acenursing.com</p>
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

    <p style="margin-top: 24px; font-size: 13px; color: #999;">Having issues downloading? Contact us at support@acenursing.com and we'll help immediately.</p>
  `;

  return resend.emails.send({
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

  return resend.emails.send({
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

  return resend.emails.send({
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

  return resend.emails.send({
    from: FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `New Order #${order.orderNumber} – $${order.total.toFixed(2)}`,
    html: emailWrapper(content),
  });
};
