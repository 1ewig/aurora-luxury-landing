/**
 * Aurora — src/app/api/webhooks/lemonsqueezy/route.ts
 *
 * POST /api/webhooks/lemonsqueezy — processes Lemon Squeezy order_created events.
 *
 * Security-critical endpoint:
 *  1. Reads raw body as text (required for HMAC verification, req.json() would
 *     consume it before we can compute the signature).
 *  2. Verifies HMAC-SHA256 signature via crypto.timingSafeEqual (timing-attack
 *     resistant).
 *  3. Parses custom_data (cart, shipping, reservation) submitted during checkout
 *     session creation.
 *  4. Opens DB transaction: idempotent dedup (processed_webhooks), verifies
 *     product existence and stock, debits inventory, deletes reservation.
 *  5. Inserts order with is_paid=true and generates order number.
 *  6. Sends order confirmation email (fire-and-forget, non-blocking).
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { withTransaction } from "@/utils/db";
import { sendEmail } from "@/lib/email";
import { orderConfirmationHtml, orderConfirmationText } from "@/lib/email-templates";
import { formatCurrency } from "@/utils/formatCurrency";
import { calculateOrderPricing } from "@/utils/pricing";
import { sanitizeShippingAddress, type VerifiedItem } from "@/utils/sanitize";
import { rethrowIfDynamicServerError } from "@/utils/errors";

/**
 * HMAC-SHA256 signature verification using timing-safe comparison.
 * The raw body must be verified BEFORE JSON.parse to prevent signature
 * ambiguity (any JSON re-serialization could change the payload).
 */
function verifySignature(rawBody: string, signatureHeader: string): boolean {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("LEMON_SQUEEZY_WEBHOOK_SECRET is not configured.");
    return false;
  }

  const hmac = crypto.createHmac("sha256", secret);
  const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
  const signature = Buffer.from(signatureHeader, "utf8");

  /*
   * Length check before timingSafeEqual prevents the function from
   * throwing on mismatched-length buffers and acts as an early rejection.
   */
  if (digest.length !== signature.length) return false;
  return crypto.timingSafeEqual(digest, signature);
}

export async function POST(req: NextRequest) {
  try {
    // Read raw body as text first — req.json() would consume the stream
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") ?? "";

    if (!signature || !verifySignature(rawBody, signature)) {
      console.warn("[LS Webhook] Failed signature verification.");
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseErr) {
      console.warn("[LS Webhook] Failed to parse request body JSON:", parseErr);
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    if (!payload || typeof payload !== "object") {
      console.warn("[LS Webhook] Payload is null or not an object.");
      return NextResponse.json({ error: "Invalid payload format." }, { status: 400 });
    }

    const eventName = payload.meta?.event_name;
    const lsEventId = payload.data?.id;

    console.log(`[LS Webhook] Received event: ${eventName} (Event ID: ${lsEventId})`);

    if (!lsEventId) {
      return NextResponse.json({ error: "Missing event ID." }, { status: 400 });
    }

    // Currently only processes order_created; other events are acknowledged but ignored
    if (eventName === "order_created") {
      await handleOrderCreated(payload, lsEventId);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    rethrowIfDynamicServerError(err);
    console.error("[LS Webhook] Error processing event payload:", err);
    return NextResponse.json({ error: "Internal processing failed." }, { status: 500 });
  }
}

/**
 * Parses a custom_data field that may arrive as a pre-deserialized object
 * or as a JSON string (Lemon Squeezy's API behavior varies).
 */
function parseCustomField<T>(val: any, fallback: T): T {
  if (val === undefined || val === null) return fallback;
  if (typeof val === "object") return val as T;
  if (typeof val === "string") {
    try {
      return JSON.parse(val) as T;
    } catch (err: any) {
      throw new Error(`Failed to parse custom field JSON: ${err.message || err}`);
    }
  }
  throw new Error(`Invalid custom field type: ${typeof val}`);
}

/** Validates the structure of cart items extracted from custom_data. */
function validateCartItems(items: any): Array<{ internalProductId: string; quantity: number; size: string }> {
  if (!Array.isArray(items)) {
    throw new Error("cart_items must be an array.");
  }
  for (const item of items) {
    if (!item || typeof item !== "object") {
      throw new Error("cart_item must be an object.");
    }
    if (typeof item.internalProductId !== "string" || !item.internalProductId.trim()) {
      throw new Error("cart_item.internalProductId must be a non-empty string.");
    }
    if (typeof item.quantity !== "number" || !Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new Error("cart_item.quantity must be a positive integer.");
    }
    if (typeof item.size !== "string") {
      throw new Error("cart_item.size must be a string.");
    }
  }
  return items;
}

/** Core order processing: idempotent dedup, inventory debit, order insert, email. */
async function handleOrderCreated(payload: any, lsEventId: string) {
  const attrs = payload.data?.attributes;
  const customData = payload.meta?.custom_data ?? {};

  if (!attrs) throw new Error("No attributes payload inside the event.");

  const lsOrderId: string = String(payload.data.id);
  const lsOrderNumber: number = attrs.order_number;
  const lsCustomerId: string = String(attrs.customer_id);

  // Guest checkouts have no userId; authenticated users with sessions have one
  const userId: string | null =
    customData.user_id && customData.user_id !== "guest" ? customData.user_id : null;

  const reservationId: string | null = customData.reservation_id ?? null;

  const cartItems = validateCartItems(parseCustomField(customData.cart_items, []));

  const shippingAddress = parseCustomField(customData.shipping_address, {});
  if (!shippingAddress || typeof shippingAddress !== "object" || Array.isArray(shippingAddress)) {
    throw new Error("shipping_address must be a valid object.");
  }
  const sanitizedAddress = sanitizeShippingAddress(shippingAddress);
  const orderNumber = `AUR-${crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase()}`;

  const { verifiedItems, subtotal } = await withTransaction(async (client) => {
    /*
     * Idempotency check: INSERT with ON CONFLICT DO NOTHING.
     * If this lsEventId was already processed, rowCount will be 0
     * and we skip the entire transaction.
     */
    const checkRes = await client.query(
      `INSERT INTO processed_webhooks (ls_event_id) 
       VALUES ($1) 
       ON CONFLICT (ls_event_id) DO NOTHING 
       RETURNING 1`,
      [lsEventId]
    );

    if ((checkRes.rowCount ?? 0) === 0) {
      console.log(`[LS Webhook] Event ${lsEventId} was already processed. Skipping.`);
      return { verifiedItems: [] as VerifiedItem[], subtotal: 0 };
    }

    const items: VerifiedItem[] = [];
    let sub = 0;

    // Verify each product exists, lock its size row, and debit stock
    for (const item of cartItems) {
      const productRes = await client.query(
        "SELECT price, name, slug, image FROM products WHERE id = $1",
        [item.internalProductId]
      );
      const product = productRes.rows[0];
      if (!product) {
        throw new Error(`Product mapping failed for ID: ${item.internalProductId}`);
      }

      const dbPrice = Number(product.price);
      sub += dbPrice * item.quantity;

      items.push({
        id: item.internalProductId,
        slug: product.slug,
        name: product.name,
        size: item.size || "",
        price: dbPrice,
        image: product.image,
        quantity: item.quantity,
      });

      // Lock the size row to prevent concurrent stock updates
      const sizeRes = await client.query(
        `SELECT id, stock FROM product_sizes
         WHERE product_id = $1 AND size = $2 FOR UPDATE`,
        [item.internalProductId, item.size]
      );
      const sizeInfo = sizeRes.rows[0];
      if (!sizeInfo) {
        throw new Error(`Size "${item.size}" not found for product "${item.internalProductId}".`);
      }

      if (sizeInfo.stock < item.quantity) {
        throw new Error(`Insufficient stock for product "${item.internalProductId}" (Size: ${item.size}).`);
      }

      // Decrement inventory permanently
      await client.query(
        `UPDATE product_sizes
         SET stock = stock - $1
         WHERE id = $2`,
        [item.quantity, sizeInfo.id]
      );
    }

    // Remove the soft reservation (it's now a confirmed order)
    if (reservationId) {
      await client.query(
        "DELETE FROM product_reservations WHERE reservation_id = $1",
        [reservationId]
      );
    }

    const { shipping, tax, total } = calculateOrderPricing(sub);

    /*
     * Insert the order with is_paid=true and status='pending'.
     * The ON CONFLICT DO NOTHING on ls_order_id is a secondary
     * idempotency guard (should never trigger if webhook dedup works).
     */
    await client.query(
      `INSERT INTO orders (
         user_id, order_number, items, subtotal, shipping, tax, total,
         shipping_address, status, is_paid, payment_provider, ls_order_id, ls_order_number
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', TRUE, 'lemonsqueezy', $9, $10)
       ON CONFLICT (ls_order_id) DO NOTHING`,
      [
        userId,
        orderNumber,
        JSON.stringify(items),
        sub,
        shipping,
        tax,
        total,
        JSON.stringify(sanitizedAddress),
        lsOrderId,
        lsOrderNumber,
      ]
    );

    // Link the LS customer ID to the user account for future purchases
    if (userId) {
      await client.query(
        `UPDATE better_auth."user"
         SET ls_customer_id = $1
         WHERE id = $2 AND ls_customer_id IS NULL`,
        [lsCustomerId, userId]
      );
    }

    return { verifiedItems: items, subtotal: sub };
  });

  // If the event was already processed, skip email
  if (verifiedItems.length === 0) return;

  const { shipping, tax, total } = calculateOrderPricing(subtotal);

  // Fire-and-forget email — failures are logged but don't block the webhook response
  await sendEmail({
    to: sanitizedAddress.email,
    subject: `Order Received — ${orderNumber}`,
    text: orderConfirmationText({
      orderNumber,
      customerName: `${sanitizedAddress.firstName} ${sanitizedAddress.lastName}`.trim() || "Valued Customer",
      items: verifiedItems.map((i) => ({
        name: i.name,
        size: i.size || "",
        quantity: i.quantity,
        price: formatCurrency(i.price),
      })),
      subtotal: formatCurrency(subtotal),
      shipping: shipping === 0 ? "Complimentary" : formatCurrency(shipping),
      tax: formatCurrency(tax),
      total: formatCurrency(total),
      shippingAddress: {
        firstName: sanitizedAddress.firstName,
        lastName: sanitizedAddress.lastName,
        address: sanitizedAddress.address,
        city: sanitizedAddress.city,
        zipCode: sanitizedAddress.zipCode,
      },
    }),
    html: orderConfirmationHtml({
      orderNumber,
      customerName: `${sanitizedAddress.firstName} ${sanitizedAddress.lastName}`.trim() || "Valued Customer",
      items: verifiedItems.map((i) => ({
        name: i.name,
        size: i.size || "",
        quantity: i.quantity,
        price: formatCurrency(i.price),
      })),
      subtotal: formatCurrency(subtotal),
      shipping: shipping === 0 ? "Complimentary" : formatCurrency(shipping),
      tax: formatCurrency(tax),
      total: formatCurrency(total),
      shippingAddress: {
        firstName: sanitizedAddress.firstName,
        lastName: sanitizedAddress.lastName,
        address: sanitizedAddress.address,
        city: sanitizedAddress.city,
        zipCode: sanitizedAddress.zipCode,
      },
    }),
  }).catch((emailErr) => {
    // Email failures are non-fatal — the order is already saved
    console.error("[LS Webhook] Failed to dispatch order confirmation email:", emailErr);
  });
}
