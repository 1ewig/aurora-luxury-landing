/**
 * Aurora — src/hooks/useCheckoutForm.ts
 *
 * Checkout form state management for Lemon Squeezy payments.
 * Handles:
 *  - 6 form fields (email, first/last name, address, city, zip)
 *    with per-field validation on change + batch validation on submit.
 *  - Prefilling email and name from the auth store (if logged in).
 *  - POST to /api/checkout/session to create a checkout session.
 *  - Storing order data snapshot in sessionStorage (for receipt display
 *    on the success page, even if the user is redirected).
 *  - Initializing the Lemon Squeezy overlay modal and wiring the
 *    Checkout.Success event handler to clear the cart.
 *  - Fallback redirect to LS checkout if the overlay fails.
 */

import { useState, useCallback } from "react";
import { useCartStore } from "@/stores/useCartStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import { validateField, validateAll, type FieldErrors } from "@/utils/validation";

export function useCheckoutForm() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const clearCart = useCartStore((s) => s.clearCart);
  const items = useCartStore((s) => s.items);

  const [email, setEmail] = useState(() => user?.email || "");
  const [prevUserEmail, setPrevUserEmail] = useState(user?.email);
  if (prevUserEmail !== user?.email) {
    setPrevUserEmail(user?.email);
    if (user?.email) setEmail((prev) => prev || user.email);
  }

  const [firstName, setFirstName] = useState(() => {
    if (profile?.displayName) {
      const parts = profile.displayName.trim().split(/\s+/);
      return parts[0] || "";
    }
    return "";
  });
  const [lastName, setLastName] = useState(() => {
    if (profile?.displayName) {
      const parts = profile.displayName.trim().split(/\s+/);
      return parts.slice(1).join(" ");
    }
    return "";
  });
  const [prevDisplayName, setPrevDisplayName] = useState(profile?.displayName);
  if (prevDisplayName !== profile?.displayName) {
    setPrevDisplayName(profile?.displayName);
    if (profile?.displayName) {
      const parts = profile.displayName.trim().split(/\s+/);
      if (parts.length > 0) setFirstName((prev) => prev || parts[0]);
      if (parts.length > 1) setLastName((prev) => prev || parts.slice(1).join(" "));
    }
  }

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => new Set(prev).add(field));
  }, []);

  const handleBlur = useCallback((field: string) => {
    markTouched(field);
  }, [markTouched]);

  // Validates the field immediately on every change for real-time feedback
  const setAndValidate = useCallback((field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    setFieldErrors((prev) => {
      const error = validateField(field, value);
      return { ...prev, [field]: error };
    });
  }, []);

  const fields: Record<string, string> = {
    email, firstName, lastName, address, city, zipCode,
  };

  /* Masks an email for display on the confirmation screen:
   * j***n@domain.com */
  const maskEmail = (rawEmail: string) => {
    const [name, domain] = rawEmail.split("@");
    if (!domain) return rawEmail;
    const maskedName = name[0] + "***" + name[name.length - 1];
    return `${maskedName}@${domain}`;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Mark all fields as touched to show all validation errors on submit
    const allTouched = new Set(Object.keys(fields));
    setTouched(allTouched);

    const errors = validateAll(fields);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setLoading(true);

    /*
     * Snapshot the cart before the async call so we can derive pricing
     * locally for the confirmation screen without another API call.
     */
    const cartItemsSnapshot = items.map((item) => ({ ...item }));
    const cartItemsPayload = items.map((item) => ({
      internalProductId: item.id,
      quantity: item.quantity,
      size: item.size,
    }));

    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: cartItemsPayload,
          shippingAddress: {
            email,
            firstName,
            lastName,
            address,
            city,
            zipCode,
          },
        }),
      });

      if (!res.ok) {
        let errMsg = "Failed to create checkout session.";
        try {
          const data = await res.json();
          errMsg = data.error || errMsg;
        } catch {
          errMsg = `HTTP error ${res.status}: ${res.statusText || "Server error"}`;
        }
        throw new Error(errMsg);
      }
      const data = await res.json();

      setLoading(false);

      /*
       * Compute pricing locally for the receipt in sessionStorage.
       * This mirrors calculateOrderPricing so the success page can
       * display pricing immediately without a server round-trip.
       */
      const subtotal = cartItemsSnapshot.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shipping = subtotal > 500 || subtotal === 0 ? 0 : 25;
      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const total = subtotal + shipping + tax;

      const checkoutData = {
        orderNumber: "Pending Fulfillment",
        email,
        maskedEmail: maskEmail(email),
        cardNumber: "•••• •••• •••• 4242",
        maskedCardNumber: "•••• •••• •••• 4242",
        items: cartItemsSnapshot,
        subtotal,
        shipping,
        tax,
        total,
      };
      sessionStorage.setItem("ls_checkout_data", JSON.stringify(checkoutData));

      /*
       * Lemon Squeezy overlay integration:
       * 1. Re-initialize the overlay if it was already loaded on the page.
       * 2. Set up event handler for Checkout.Success → clear cart + invalidate orders.
       * 3. Open the checkout URL in the overlay modal.
       * 4. Fallback to redirect if the overlay JS didn't load.
       */
      if (window.createLemonSqueezy) {
        window.createLemonSqueezy();
      }

      if (window.LemonSqueezy) {
        window.LemonSqueezy.Setup({
          eventHandler: (event) => {
            if (event.event === "Checkout.Success") {
              clearCart();
              queryClient.invalidateQueries({ queryKey: ["orders"] });
            }
          }
        });

        window.LemonSqueezy.Url.Open(data.checkoutUrl);
      } else {
        // Fallback: redirect the user to the LS hosted checkout page
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      setError(err.message || "Failed to initiate payment. Please try again.");
      setLoading(false);
    }
  };

  return {
    email,
    setEmail: (v: string) => setAndValidate("email", v, setEmail),
    firstName,
    setFirstName: (v: string) => setAndValidate("firstName", v, setFirstName),
    lastName,
    setLastName: (v: string) => setAndValidate("lastName", v, setLastName),
    address,
    setAddress: (v: string) => setAndValidate("address", v, setAddress),
    city,
    setCity: (v: string) => setAndValidate("city", v, setCity),
    zipCode,
    setZipCode: (v: string) => setAndValidate("zipCode", v, setZipCode),
    loading, items, handlePlaceOrder,
    error, setError,
    fieldErrors, handleBlur, touched,
  };
}
