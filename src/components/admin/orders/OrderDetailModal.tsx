/**
 * Aurora — src/components/admin/orders/OrderDetailModal.tsx
 *
 * Slide-in order detail panel with item breakdown, shipping info,
 * customer details, and inline status update controls.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { type OrderData } from "@/stores/useAdminStore";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { useBodyScrollLock } from "@/hooks/ui/useBodyScrollLock";

interface OrderDetailModalProps {
  order: OrderData | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: string) => void;
  updatingStatusId: string | null;
  isAdmin: boolean;
}

/** Order detail modal with line items, shipping, totals, and status controls. */
export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onStatusUpdate,
  updatingStatusId,
  isAdmin,
}: OrderDetailModalProps) {
  useBodyScrollLock(isOpen);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const isUpdating = updatingStatusId === order.id;

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Date unknown";

  const totalItemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div
      className="fixed inset-0 z-[100] p-3 pb-6 sm:p-6 flex items-center justify-center animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-details-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-bg-secondary border border-border-subtle rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden z-10">
        
        {/* ================= BARE MINIMUM HEADER ================= */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-border-subtle bg-bg-secondary">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-accent-primary shrink-0" />
            <h2 id="order-details-title" className="text-xs sm:text-sm font-bold uppercase tracking-widest text-text-primary truncate">
              Order Details
            </h2>
            <span className="font-mono text-[11px] font-semibold text-text-secondary bg-bg-primary border border-border-subtle px-2 py-0.5 rounded-md shrink-0">
              #{order.orderNumber}
            </span>
            <div className="hidden sm:flex items-center gap-2 ml-1">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                  order.isPaid
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                }`}
              >
                {order.isPaid ? "Paid" : "Unpaid"}
              </span>
              <OrderStatusBadge status={order.status} />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer rounded-full hover:bg-bg-primary shrink-0 ml-2"
            aria-label="Close order details"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mobile status banner */}
        <div className="flex sm:hidden items-center justify-between px-5 py-2 border-b border-border-subtle bg-bg-primary/20 text-xs">
          <span className="text-text-muted text-[11px]">Status</span>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                order.isPaid
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
              }`}
            >
              {order.isPaid ? "Paid" : "Unpaid"}
            </span>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        {/* ================= SCROLLABLE BODY ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* LEFT COLUMN: Line Items & Totals (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Items Card */}
              <div className="border border-border-subtle bg-bg-primary/25 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-border-subtle/50">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Items Ordered ({totalItemsCount})
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {order.items.map((item) => (
                    <div
                      key={`${item.id}-${item.size}`}
                      className="flex items-center gap-3.5 p-2.5 sm:p-3 rounded-xl bg-bg-secondary border border-border-subtle hover:border-border-medium transition-colors"
                    >
                      {item.image ? (
                        <div className="relative w-12 h-16 rounded-lg overflow-hidden border border-border-subtle bg-bg-primary shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-16 bg-bg-primary rounded-lg flex items-center justify-center border border-border-subtle shrink-0 text-text-muted text-[10px]">
                          No img
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.slug}`}
                          className="font-medium text-text-primary text-xs sm:text-sm truncate hover:text-accent-primary transition-colors block"
                        >
                          {item.name}
                        </Link>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-bg-primary text-[10px] font-medium text-text-secondary border border-border-subtle">
                            Size: {item.size}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-bg-primary text-[10px] font-medium text-text-secondary border border-border-subtle">
                            Qty: {item.quantity}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-semibold text-text-primary text-xs sm:text-sm font-mono">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-[10px] text-text-muted font-mono mt-0.5">
                            ${item.price.toFixed(2)} ea
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Math Card */}
              <div className="border border-border-subtle rounded-2xl p-4 sm:p-5 bg-bg-primary/25 space-y-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary pb-1 border-b border-border-subtle/50">
                  Payment Breakdown
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-text-secondary">
                    <span>Subtotal</span>
                    <span className="font-mono font-medium text-text-primary">${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Shipping</span>
                    <span className="font-mono font-medium text-text-primary">
                      {order.shipping === 0 ? "Free" : `$${order.shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Estimated Tax (8%)</span>
                    <span className="font-mono font-medium text-text-primary">${order.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-baseline border-t border-border-subtle pt-2.5 text-sm">
                    <span className="font-bold text-text-primary">Total Paid</span>
                    <span className="font-mono font-bold text-base text-accent-primary">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Customer, Shipping & Controls (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Shipping / Customer Card */}
              <div className="border border-border-subtle bg-bg-primary/25 p-4 sm:p-5 rounded-2xl space-y-3.5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 pb-1 border-b border-border-subtle/50">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Delivery & Contact
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Recipient</span>
                    <div className="font-semibold text-text-primary text-xs sm:text-sm mt-0.5">
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Destination</span>
                    <div className="text-text-secondary mt-0.5 leading-relaxed">
                      <p>{order.shippingAddress.address}</p>
                      <p>{order.shippingAddress.city}, {order.shippingAddress.zipCode}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Email Address</span>
                    <div className="flex items-center justify-between gap-2 mt-0.5 bg-bg-secondary p-2 rounded-lg border border-border-subtle">
                      <a
                        href={`mailto:${order.shippingAddress.email}`}
                        className="font-mono text-xs text-text-primary hover:text-accent-primary truncate"
                      >
                        {order.shippingAddress.email}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(order.shippingAddress.email)}
                        className="p-1 text-text-muted hover:text-text-primary rounded transition-colors shrink-0 cursor-pointer"
                        title="Copy Email"
                        aria-label="Copy Email"
                      >
                        {copiedEmail ? (
                          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Management Card (Admin) */}
              {isAdmin && (
                <div className="border border-border-subtle bg-bg-primary/25 p-4 sm:p-5 rounded-2xl space-y-3.5 relative overflow-hidden">
                  {isUpdating && (
                    <div className="absolute inset-0 bg-bg-secondary/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10 animate-in fade-in duration-150">
                      <svg className="animate-spin h-5 w-5 text-accent-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-primary">
                        Updating Status...
                      </span>
                    </div>
                  )}

                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 pb-1 border-b border-border-subtle/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                    Fulfillment Control
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Current Status:</span>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label htmlFor="order-status-select" className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        Update Fulfillment Status
                      </label>
                      <div className="relative">
                        <select
                          id="order-status-select"
                          disabled={isUpdating}
                          value={order.status}
                          onChange={(e) => onStatusUpdate(order.id, e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-medium rounded-xl text-xs font-semibold text-text-primary focus:border-accent-primary focus:outline-none transition-colors cursor-pointer appearance-none pr-10 hover:border-text-muted disabled:opacity-50"
                          style={{
                            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B6B6B' stroke-width='2'><path stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/></svg>")`,
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 0.85rem center",
                            backgroundSize: "0.85rem",
                          }}
                        >
                          <option value="pending">🟡 Pending</option>
                          <option value="confirmed">🔵 Confirmed</option>
                          <option value="shipped">🟣 Shipped</option>
                          <option value="delivered">🟢 Delivered</option>
                          <option value="cancelled">🔴 Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-t border-border-subtle bg-bg-secondary flex items-center justify-between gap-3">
          <span className="text-[11px] text-text-muted font-mono">
            Placed {formattedDate}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border border-border-subtle hover:border-text-primary bg-white text-text-primary transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 shrink-0 ml-auto"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
