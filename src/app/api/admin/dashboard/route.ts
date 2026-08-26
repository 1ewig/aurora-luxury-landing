/**
 * Aurora — src/app/api/admin/dashboard/route.ts
 *
 * GET /api/admin/dashboard — returns aggregate metrics and recent orders.
 * Admin-only. Requires authentication and admin role.
 */

import { NextResponse } from 'next/server';
import { pool } from '@/utils/db';
import { requireAdmin } from '@/utils/admin';
import { rethrowIfDynamicServerError } from '@/utils/errors';

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const statsPromises = [
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN total ELSE 0 END), 0) as "totalSales",
          COUNT(CASE WHEN status <> 'cancelled' THEN 1 END) as "totalOrders",
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as "pendingCount",
          COUNT(CASE WHEN status = 'shipped' THEN 1 END) as "shippedCount"
        FROM orders
      `),
      pool.query(`
        SELECT COUNT(*) as "lowStockCount"
        FROM (
          SELECT DISTINCT product_id
          FROM product_sizes
          WHERE stock < 5
        ) as low_stock
      `),
      pool.query(`
        SELECT
          order_number as "orderNumber",
          total,
          status,
          is_paid as "isPaid",
          created_at as "createdAt",
          shipping_address->>'firstName' as "firstName",
          shipping_address->>'lastName' as "lastName"
        FROM orders
        ORDER BY created_at DESC
        LIMIT 5
      `),
    ];

    const [ordersAggRes, stockRes, recentRes] = await Promise.all(statsPromises);

    const aggRow = ordersAggRes.rows[0] || {};
    const totalSales = Number(aggRow.totalSales || 0);
    const totalOrders = Number(aggRow.totalOrders || 0);
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const pendingCount = Number(aggRow.pendingCount || 0);
    const shippedCount = Number(aggRow.shippedCount || 0);
    const lowStockCount = Number(stockRes.rows[0]?.lowStockCount || 0);

    const recentOrders = recentRes.rows.map(row => ({
      ...row,
      total: Number(row.total),
    }));

    return NextResponse.json({
      metrics: {
        totalSales,
        totalOrders,
        averageOrderValue,
        pendingCount,
        shippedCount,
        lowStockCount,
      },
      recentOrders,
    });
  } catch (err: unknown) {
    rethrowIfDynamicServerError(err);
    console.error('Failed to load dashboard metrics:', err);
    return NextResponse.json({ error: 'Failed to load dashboard metrics' }, { status: 500 });
  }
}
