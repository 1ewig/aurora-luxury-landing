/**
 * Aurora — src/components/admin/orders/OrderDetailModal.tsx
 *
 * Slide-in order detail panel with item breakdown, shipping info,
 * and inline status update controls.
 */

"use client";

import Link from "next/link";
import Image from "next/image";
// framer-motion animation removed
import { type OrderData } from "@/stores/useAdminStore";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";

interface OrderDetailModalProps {
  order: OrderData | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: string) => void;
  updatingStatusId: string | null;
  isAdmin: boolean;
}

/** Order detail slide-over with line items, shipping, totals, and status controls. */
export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onStatusUpdate,
  updatingStatusId,
  isAdmin,
}: OrderDetailModalProps) {
  if (!order) return null;

  const isUpdating = updatingStatusId === order.id;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 p-4 sm:p-6 md:p-10 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/55 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog Content */}
          <div
            className="relative w-full max-w-4xl bg-bg-secondary border border-border-subtle rounded-[24px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 sm:px-8 py-4 border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <h2 className="font-display font-black text-2xl uppercase tracking-wider">
                  Order Details
                </h2>
                <span className="font-mono text-lg text-text-secondary">({order.orderNumber})</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer rounded-full hover:bg-bg-primary"
                aria-label="Close details"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-6">
              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Side: Order Items */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-3">
                    Order Items
                  </h3>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id + item.size}
                        className="flex gap-4 bg-bg-primary/20 p-3 rounded-2xl border border-border-subtle"
                      >
                        {item.image ? (
                          <div className="relative w-12 h-16 rounded-[8px] overflow-hidden border border-border-subtle shrink-0">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-16 bg-bg-primary rounded-[8px] shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <Link href={`/products/${item.slug}`} className="font-semibold text-text-primary text-sm truncate hover:text-accent-primary transition-colors cursor-pointer block">{item.name}</Link>
                          <div className="text-xs text-text-muted mt-1 flex gap-3">
                            <span>Size: {item.size}</span>
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-text-primary text-sm">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                          <div className="text-[10px] text-text-muted mt-0.5">
                            (${item.price} each)
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary math */}
                  <div className="border border-border-subtle rounded-2xl p-4 space-y-2.5 bg-bg-primary/10 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Subtotal</span>
                      <span className="font-semibold text-text-primary">${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Shipping</span>
                      <span className="font-semibold text-text-primary">
                        {order.shipping === 0 ? "Free" : `$${order.shipping.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Tax (8%)</span>
                      <span className="font-semibold text-text-primary">${order.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border-subtle pt-2 text-sm font-bold">
                      <span className="text-text-primary">Total Price</span>
                      <span className="text-accent-primary">${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Shipping Customer */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-3">
                      Shipping Details
                    </h3>
                    <div className="bg-bg-primary/20 p-4 border border-border-subtle rounded-2xl space-y-3 text-xs leading-relaxed text-text-secondary">
                      <div>
                        <div className="font-bold text-text-primary">Customer Name</div>
                        <div>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</div>
                      </div>
                      <div>
                        <div className="font-bold text-text-primary">Address</div>
                        <div>{order.shippingAddress.address}</div>
                        <div>
                          {order.shippingAddress.city}, {order.shippingAddress.zipCode}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-text-primary">Email Address</div>
                        <div>{order.shippingAddress.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions status panel */}
                  {isAdmin && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-3">
                        Modify Status
                      </h3>
                      <div className="border border-border-subtle p-4 rounded-2xl space-y-3 bg-bg-primary/10 relative overflow-hidden">
                        {isUpdating && (
                          <div className="absolute inset-0 bg-bg-secondary/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 transition-all duration-300">
                            <svg className="animate-spin h-5 w-5 text-accent-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-primary">Updating Status...</span>
                          </div>
                        )}
                        <div className="text-xs flex items-center justify-between border-b border-border-subtle pb-2">
                          <span className="text-text-secondary">Payment Status:</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            order.isPaid 
                              ? "bg-success/10 text-success border border-success/20" 
                              : "bg-text-secondary/10 text-text-secondary border border-border-medium"
                          }`}>
                            {order.isPaid ? "Paid" : "Unpaid"}
                          </span>
                        </div>
                        <div className="text-xs flex items-center justify-between pt-1">
                          <span className="text-text-secondary">Fulfillment Status:</span>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <div className="pt-2 space-y-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                            Change Fulfillment Status
                          </label>
                          <div className="relative">
                            <select
                              disabled={isUpdating}
                              value={order.status}
                              onChange={(e) => onStatusUpdate(order.id, e.target.value)}
                              className="block w-full px-4 py-2.5 pr-10 bg-bg-secondary border border-border-medium rounded-xl text-xs font-semibold focus:border-accent-primary focus:outline-none transition-colors cursor-pointer appearance-none"
                              style={{
                                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B6B6B' stroke-width='2'><path stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/></svg>")`,
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "right 1rem center",
                                backgroundSize: "0.85rem"
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
