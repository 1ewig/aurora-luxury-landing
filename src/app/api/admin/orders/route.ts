/**
 * Aurora — src/app/api/admin/orders/route.ts
 *
 * GET /api/admin/orders — returns all orders for the admin panel.
 * Admin-only. Includes full order details with shipping info.
 */

import { NextResponse } from 'next/server';
import { pool } from '@/utils/db';
import { requireAdmin } from '@/utils/admin';
import { rethrowIfDynamicServerError } from '@/utils/errors';

export async function GET(request: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(
        order_number ILIKE $${paramIndex} OR
        shipping_address->>'email' ILIKE $${paramIndex} OR
        shipping_address->>'firstName' ILIKE $${paramIndex} OR
        shipping_address->>'lastName' ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status && status !== 'all') {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(`
      SELECT
        id,
        user_id as "userId",
        order_number as "orderNumber",
        items,
        subtotal,
        shipping,
        tax,
        total,
        shipping_address as "shippingAddress",
        status,
        is_paid as "isPaid",
        created_at as "createdAt",
        COUNT(*) OVER() AS "totalCount"
      FROM orders
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...params, limit, offset]);

    const total = result.rows.length > 0 ? Number(result.rows[0].totalCount) : 0;
    const orders = result.rows.map(row => ({
      ...row,
      subtotal: Number(row.subtotal),
      shipping: Number(row.shipping),
      tax: Number(row.tax),
      total: Number(row.total),
    }));

    const missingImgIds = [
      ...new Set(
        orders.flatMap(o =>
          (o.items as any[])
            .filter(item => !item.image)
            .map(item => item.id)
        )
      ),
    ];
    if (missingImgIds.length > 0) {
      const imgResult = await pool.query(
        `SELECT id, image FROM products WHERE id = ANY($1)`,
        [missingImgIds]
      );
      const imageMap = Object.fromEntries(
        imgResult.rows.map(r => [r.id, r.image])
      );
      for (const order of orders) {
        for (const item of order.items as any[]) {
          if (!item.image && imageMap[item.id]) {
            item.image = imageMap[item.id];
          }
        }
      }
    }

    return NextResponse.json({
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: unknown) {
    rethrowIfDynamicServerError(err);
    console.error('Failed to list orders:', err);
    return NextResponse.json({ error: 'Failed to list orders' }, { status: 500 });
  }
}
