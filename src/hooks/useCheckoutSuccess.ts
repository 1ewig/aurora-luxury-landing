/**
 * Aurora — src/hooks/useCheckoutSuccess.ts
 *
 * Post-checkout success page hook. On mount:
 *  1. Clears the cart (the order has been placed).
 *  2. Reads and parses order data from sessionStorage (set by
 *     useCheckoutForm before the user was redirected to LS).
 *  3. Polls the orders API using the LS order_id from the query
 *     string to resolve the real database orderNumber (the webhook
 *     may not have fired yet when the user lands on this page).
 *
 * The polling loop runs up to 10 times at 1.5s intervals, giving
 * the webhook ~15 seconds to process before the user gives up
 * waiting for a real order number.
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { useCartStore } from "@/stores/useCartStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSearchParams } from "next/navigation";

const emptySubscribe = () => () => {};

interface CheckoutData {
  orderNumber: string;
  email: string;
  maskedEmail: string;
  cardNumber?: string;
  maskedCardNumber?: string;
  items: any[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export function useCheckoutSuccess() {
  const clearCart = useCartStore((s) => s.clearCart);
  const user = useAuthStore((s) => s.user);
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [orderData, setOrderData] = useState<CheckoutData | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem("ls_checkout_data");
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      sessionStorage.removeItem("ls_checkout_data");
      return parsed;
    } catch (e) {
      console.error("Failed to parse ls_checkout_data", e);
      return null;
    }
  });
  const isLoaded = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    // Clear cart immediately — items are now a confirmed order, not in a cart
    clearCart();
  }, [clearCart]);

  /*
   * Poll for the real order number. At this point, the Lemon Squeezy
   * webhook may not have been received yet, so the order may not exist
   * in our database. We poll GET /api/orders?lsOrderId= up to 10 times
   * at 1.5s intervals. The first successful response with an orderNumber
   * stops the polling and updates the display.
   */
  const hasOrderData = orderData !== null;
  useEffect(() => {
    // Don't poll if there's no LS order ID, or if we don't have base checkout data yet
    if (!orderId || !hasOrderData) return;

    let attempts = 0;
    const maxAttempts = 10;
    let timerId: NodeJS.Timeout;

    async function poll() {
      try {
        const res = await fetch(`/api/orders?lsOrderId=${encodeURIComponent(orderId || "")}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.orderNumber) {
            setOrderData((prev) => {
              if (!prev) return null;
              return { ...prev, orderNumber: data.orderNumber };
            });
            return; // Success, stop polling
          }
        }
      } catch (err) {
        console.error("Error looking up order number:", err);
      }

      attempts++;
      if (attempts < maxAttempts) {
        timerId = setTimeout(poll, 1500);
      }
    }

    // First poll starts after 1s delay
    timerId = setTimeout(poll, 1000);

    return () => clearTimeout(timerId);
  }, [orderId, hasOrderData]);

  return {
    orderData,
    isLoaded,
    user,
  };
}
