/**
 * Aurora — src/lib/email-templates.ts
 *
 * Order confirmation email templates — HTML and plain-text variants.
 * Used by the order-processing flow to notify customers of successful purchases.
 */

export interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  items: Array<{ name: string; size: string; quantity: number; price: string }>;
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    zipCode: string;
  };
}

/** Escapes HTML special chars to prevent XSS in email templates. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Reusable email shell — wraps content in the Aurora brand frame. */
function emailShell(contentHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden">
    <tr>
      <td style="padding:32px 32px 0;text-align:center">
        <h1 style="font-size:24px;letter-spacing:4px;text-transform:uppercase;margin:0 0 4px;color:#111;font-weight:400">Aurora</h1>
        <p style="color:#999;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin:0 0 24px">Curated Wardrobe Essentials</p>
      </td>
    </tr>
    <tr><td style="height:1px;background:#eee;display:block;margin:0 32px"><div style="height:1px;background:#eee"></div></td></tr>
    ${contentHtml}
    <tr>
      <td style="padding:0 32px 32px;text-align:center">
        <p style="font-size:12px;color:#999;margin:0;line-height:1.6">
          Aurora — Curated Wardrobe Essentials<br>
          <span style="font-size:11px">If you didn&rsquo;t request this email, you can safely ignore it.</span>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Verification email — HTML */
export function verificationEmailHtml(url: string, name?: string): string {
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi there,';
  return emailShell(`
    <tr>
      <td style="padding:32px 32px 0;text-align:center">
        <h2 style="font-size:20px;letter-spacing:1px;margin:0 0 8px;color:#111;font-weight:500">Verify Your Email Address</h2>
        <p style="font-size:14px;color:#666;margin:0;line-height:1.6">${greeting}</p>
        <p style="font-size:14px;color:#666;margin:8px 0 0;line-height:1.6">Thanks for joining Aurora. Please verify your email address to get started with your account.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 32px;text-align:center">
        <a href="${url}" style="display:inline-block;padding:14px 40px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;letter-spacing:1px;text-transform:uppercase;font-weight:500">Verify Email</a>
        <p style="font-size:12px;color:#999;margin:16px 0 0">This link expires in 1 hour.</p>
      </td>
    </tr>
  `);
}

/** Verification email — plain text */
export function verificationEmailText(url: string, name?: string): string {
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  return [
    'Verify Your Email Address',
    '',
    greeting,
    'Thanks for joining Aurora. Please verify your email address to get started.',
    '',
    `Verify: ${url}`,
    '',
    'This link expires in 1 hour.',
    '— Aurora',
  ].join('\n');
}

/** Password reset email — HTML */
export function resetPasswordEmailHtml(url: string, name?: string): string {
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi there,';
  return emailShell(`
    <tr>
      <td style="padding:32px 32px 0;text-align:center">
        <h2 style="font-size:20px;letter-spacing:1px;margin:0 0 8px;color:#111;font-weight:500">Reset Your Password</h2>
        <p style="font-size:14px;color:#666;margin:0;line-height:1.6">${greeting}</p>
        <p style="font-size:14px;color:#666;margin:8px 0 0;line-height:1.6">We received a request to reset the password for your Aurora account. Click the button below to set a new password.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 32px;text-align:center">
        <a href="${url}" style="display:inline-block;padding:14px 40px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;letter-spacing:1px;text-transform:uppercase;font-weight:500">Reset Password</a>
        <p style="font-size:12px;color:#999;margin:16px 0 0">This link expires in 1 hour. If you didn&rsquo;t request this, please ignore this email.</p>
      </td>
    </tr>
  `);
}

/** Password reset email — plain text */
export function resetPasswordEmailText(url: string, name?: string): string {
  const greeting = name ? `Hi ${name},` : 'Hi there,';
  return [
    'Reset Your Password',
    '',
    greeting,
    'We received a request to reset the password for your Aurora account.',
    '',
    `Reset: ${url}`,
    '',
    'This link expires in 1 hour. If you didn\'t request this, please ignore this email.',
    '— Aurora',
  ].join('\n');
}

/** Sign-up alert email — HTML */
export function signUpAlertHtml(email: string): string {
  return emailShell(`
    <tr>
      <td style="padding:32px 32px 0;text-align:center">
        <h2 style="font-size:20px;letter-spacing:1px;margin:0 0 8px;color:#111;font-weight:500">Sign-Up Attempt Detected</h2>
        <p style="font-size:14px;color:#666;margin:0;line-height:1.6">Hi there,</p>
        <p style="font-size:14px;color:#666;margin:8px 0 0;line-height:1.6">Someone tried to create an Aurora account using <strong>${escapeHtml(email)}</strong>.</p>
        <p style="font-size:14px;color:#666;margin:8px 0 0;line-height:1.6">If this was you, please <a href="https://aurora.com/login" style="color:#111;text-decoration:underline">sign in</a> instead. If not, you can safely ignore this email.</p>
      </td>
    </tr>
  `);
}

/** Sign-up alert email — plain text */
export function signUpAlertText(email: string): string {
  return [
    'Sign-Up Attempt Detected',
    '',
    'Hi there,',
    `Someone tried to create an Aurora account using ${email}.`,
    '',
    'If this was you, sign in instead. If not, you can safely ignore this email.',
    '— Aurora',
  ].join('\n');
}

/** Builds a styled HTML email for order confirmation. */
export function orderConfirmationHtml(data: OrderConfirmationData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;font-size:14px;color:#333">
          ${escapeHtml(item.name)} — <span style="color:#888;font-size:12px">Size: ${escapeHtml(item.size)} × Qty: ${item.quantity}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;font-size:14px;color:#333;text-align:right;font-family:monospace">
          ${item.price}
        </td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden">
    <tr>
      <td style="padding:32px 32px 0;text-align:center">
        <h1 style="font-size:28px;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px;color:#111">Order Received</h1>
        <p style="color:#666;font-size:14px;margin:0">Thank you for your purchase.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px">
        <p style="font-size:14px;color:#333;margin:0 0 16px">Hi <strong>${escapeHtml(data.customerName)}</strong>,</p>
        <p style="font-size:14px;color:#333;margin:0 0 16px">Your order <strong style="font-family:monospace">${data.orderNumber}</strong> has been received and is pending fulfillment.</p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:8px;padding:16px;margin-bottom:20px">
          <tr><td style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px">Shipping To</td></tr>
          <tr><td style="font-size:14px;color:#333">${escapeHtml(data.shippingAddress.firstName)} ${escapeHtml(data.shippingAddress.lastName)}</td></tr>
          <tr><td style="font-size:14px;color:#333">${escapeHtml(data.shippingAddress.address)}</td></tr>
          <tr><td style="font-size:14px;color:#333">${escapeHtml(data.shippingAddress.city)} ${escapeHtml(data.shippingAddress.zipCode)}</td></tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px">
          <tr>
            <th style="text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;padding-bottom:4px">Item</th>
            <th style="text-align:right;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;padding-bottom:4px">Total</th>
          </tr>
          ${itemsHtml}
        </table>

        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:13px;color:#666;padding:4px 0">Subtotal</td>
            <td style="font-size:13px;color:#666;padding:4px 0;text-align:right;font-family:monospace">${data.subtotal}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#666;padding:4px 0">Shipping</td>
            <td style="font-size:13px;color:#666;padding:4px 0;text-align:right;font-family:monospace">${data.shipping}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#666;padding:4px 0">Tax</td>
            <td style="font-size:13px;color:#666;padding:4px 0;text-align:right;font-family:monospace">${data.tax}</td>
          </tr>
          <tr>
            <td style="font-size:15px;font-weight:700;color:#111;padding:8px 0;border-top:2px dashed #ddd">Total Charged</td>
            <td style="font-size:15px;font-weight:700;color:#111;padding:8px 0;border-top:2px dashed #ddd;text-align:right;font-family:monospace">${data.total}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 32px;text-align:center">
        <p style="font-size:12px;color:#999;margin:0">Aurora — Curated Wardrobe Essentials</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Builds a plain-text email for order confirmation (fallback / non-HTML clients). */
export function orderConfirmationText(data: OrderConfirmationData): string {
  const itemsList = data.items
    .map((item) => `  ${item.name} (Size: ${item.size} × ${item.quantity}) — ${item.price}`)
    .join("\n");

  return [
    `Order Received — ${data.orderNumber}`,
    "",
    `Hi ${data.customerName},`,
    `Your order ${data.orderNumber} has been received and is pending fulfillment.`,
    "",
    "Shipping To:",
    `  ${data.shippingAddress.firstName} ${data.shippingAddress.lastName}`,
    `  ${data.shippingAddress.address}`,
    `  ${data.shippingAddress.city} ${data.shippingAddress.zipCode}`,
    "",
    "Items:",
    itemsList,
    "",
    `Subtotal: ${data.subtotal}`,
    `Shipping: ${data.shipping}`,
    `Tax: ${data.tax}`,
    `Total: ${data.total}`,
    "",
    "— Aurora",
  ].join("\n");
}
