/**
 * Aurora — src/components/checkout/CheckoutSuccess.tsx
 *
 * Order-confirmation view displayed after a successful (mock) checkout. Shows
 * purchased items, pricing breakdown, and a reference number.
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatCurrency";

interface CheckoutSuccessProps {
  orderNumber: string;
  email: string;
  cardNumber?: string;
  maskedCardNumber?: string;
  items: Array<{
    id: string;
    slug: string;
    name: string;
    price: number;
    size: string;
    image: string;
    category: string;
    quantity: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

/** Order success UI — item list, pricing totals, masked card info, and a reference number. */
export function CheckoutSuccess({
  orderNumber,
  email,
  items,
  subtotal,
  shipping,
  tax,
  total,
}: CheckoutSuccessProps) {
  return (
    <div
      className="max-w-xl mx-auto space-y-6 text-center py-12 px-6 md:px-8 bg-white rounded-2xl border border-border-subtle shadow-sm"
    >
      <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>

      <h2 className="font-display font-black text-3xl tracking-tight text-text-primary">
        Order Received
      </h2>

      <p className="text-text-secondary max-w-md mx-auto text-sm md:text-base leading-relaxed">
        Thank you for your purchase. We are preparing your order. A confirmation email has been sent to:
        <span className="block font-medium text-text-primary mt-1">{email}</span>
      </p>

      {/* Purchased Items List */}
      <div className="bg-bg-primary/50 border border-border-subtle rounded-xl p-6 text-left space-y-4 max-w-md mx-auto">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border-subtle pb-2">
          Your Items
        </h3>
        <ul className="divide-y divide-border-subtle">
          {items.map((item) => (
            <li key={`${item.id}-${item.size}`} className="py-3 flex gap-3">
              <div className="relative w-10 h-14 rounded bg-border-subtle overflow-hidden flex-shrink-0 border border-border-subtle">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="40px"
                  className="object-cover object-top"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-0.5 text-left">
                <p className="font-medium text-text-primary text-sm truncate max-w-[240px]">{item.name}</p>
                <p className="text-[10px] text-text-secondary uppercase tracking-wider">Size: {item.size} × Qty: {item.quantity}</p>
                <span className="font-mono text-xs font-semibold text-text-primary block mt-0.5">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className="pt-3 border-t border-border-subtle space-y-2 text-xs">
          <div className="flex justify-between text-text-secondary">
            <span>Subtotal</span>
            <span className="font-mono">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>Shipping</span>
            <span className="font-mono">{shipping === 0 ? "Complimentary" : formatCurrency(shipping)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>Estimated Tax (8%)</span>
            <span className="font-mono">{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-text-primary text-sm pt-2 border-t border-dashed border-border-medium">
            <span>Total Charged</span>
            <span className="font-mono">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div className="bg-bg-primary py-4 px-6 rounded-lg max-w-xs mx-auto border border-border-subtle font-mono text-sm space-y-1">
        <span className="text-text-muted text-xs uppercase tracking-wider block">Reference Number</span>
        <span className="text-text-primary font-bold">{orderNumber}</span>
      </div>

      <p className="text-xs text-text-secondary flex items-center justify-center gap-1 mt-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5 text-success">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <span>Payment Method:</span>
        <span className="font-semibold text-text-primary">Secured by Lemon Squeezy</span>
      </p>

      <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Link href="/products">
          <Button variant="ghost" size="sm" className="text-xs">
            Shop More
          </Button>
        </Link>
      </div>
    </div>
  );
}

