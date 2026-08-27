/**
 * Aurora — __tests__/utils/schemas.test.ts
 *
 * Tests for Zod validation schemas and media URL sanitization.
 */

import { describe, it, expect } from 'vitest';
import {
  isValidMediaUrl,
  createProductSchema,
  updateProductSchema,
  updateUserSchema,
  updateOrderStatusSchema,
} from '@/utils/schemas';

describe('isValidMediaUrl', () => {
  it('accepts valid InsForge storage HTTPS URLs', () => {
    expect(
      isValidMediaUrl('https://4eu5wk8i.us-east.insforge.app/api/storage/buckets/product-media/objects/test.webp')
    ).toBe(true);
    expect(isValidMediaUrl('https://insforge.app/storage/img.jpg')).toBe(true);
  });

  it('accepts safe internal root-relative image paths', () => {
    expect(isValidMediaUrl('/images/products/overcoat.webp')).toBe(true);
    expect(isValidMediaUrl('/img.jpg')).toBe(true);
  });

  it('rejects unsafe protocols and malicious strings', () => {
    expect(isValidMediaUrl('javascript:alert(1)')).toBe(false);
    expect(isValidMediaUrl('data:image/svg+xml;utf8,<svg></svg>')).toBe(false);
    expect(isValidMediaUrl('http://insecure-domain.com/img.jpg')).toBe(false);
    expect(isValidMediaUrl('/images/../secret.env')).toBe(false);
    expect(isValidMediaUrl('')).toBe(false);
    expect(isValidMediaUrl('   ')).toBe(false);
  });
});

describe('createProductSchema', () => {
  const validProduct = {
    id: 'prod-123',
    slug: 'silk-shirt',
    name: 'Silk Shirt',
    category: 'Trousers',
    price: 350,
    badge: 'New',
    image: 'https://4eu5wk8i.us-east.insforge.app/api/storage/buckets/product-media/objects/shirt.webp',
    altText: 'Silk shirt in black',
    span: '2',
    aspectRatio: '3/4',
    description: 'A finely tailored silk shirt crafted from 100% mulberry silk.',
    images: [
      'https://4eu5wk8i.us-east.insforge.app/api/storage/buckets/product-media/objects/shirt-2.webp',
    ],
    sizes: [{ size: 'M', stock: 12 }],
    details: ['100% silk', 'Dry clean only'],
  };

  it('accepts valid product payload', () => {
    const result = createProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('rejects unknown / unexpected extra fields due to .strict()', () => {
    const maliciousPayload = {
      ...validProduct,
      injectedAdminFlag: true,
    };
    const result = createProductSchema.safeParse(maliciousPayload);
    expect(result.success).toBe(false);
  });

  it('rejects invalid image URL protocols (e.g. javascript: or http:)', () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      image: 'http://malicious.com/hack.jpg',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative price', () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      price: -50,
    });
    expect(result.success).toBe(false);
  });
});

describe('updateProductSchema', () => {
  const validUpdate = {
    slug: 'wool-trousers',
    name: 'Wool Trousers',
    category: 'Trousers',
    price: 450,
    image: '/images/products/trousers.webp',
    altText: 'Pleated wool trousers',
    description: 'High-waisted pleated trousers tailored from Italian wool flannel.',
    images: ['/images/products/trousers-back.webp'],
    sizes: [{ size: 'L', stock: 5 }],
    details: ['Pleated front'],
  };

  it('accepts valid update payload', () => {
    const result = updateProductSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('accepts valid update payload including optional id and stock levels', () => {
    const result = updateProductSchema.safeParse({
      ...validUpdate,
      id: 'p-1',
      sizes: [
        { size: 'S', stock: 0 },
        { size: 'M', stock: 25 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown fields in update payload', () => {
    const result = updateProductSchema.safeParse({
      ...validUpdate,
      unauthorizedField: 'attack',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateUserSchema', () => {
  it('accepts valid user update fields', () => {
    expect(updateUserSchema.safeParse({ name: 'Alice', role: 'admin' }).success).toBe(true);
    expect(updateUserSchema.safeParse({ emailVerified: true }).success).toBe(true);
    expect(updateUserSchema.safeParse({ emailVerified: 'true' }).success).toBe(true);
  });

  it('rejects invalid roles and unknown fields', () => {
    expect(updateUserSchema.safeParse({ role: 'superadmin' }).success).toBe(false);
    expect(updateUserSchema.safeParse({ name: 'Bob', passwordHash: '123' }).success).toBe(false);
  });
});

describe('updateOrderStatusSchema', () => {
  it('accepts allowed order statuses', () => {
    for (const status of ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']) {
      expect(updateOrderStatusSchema.safeParse({ status }).success).toBe(true);
    }
  });

  it('rejects unauthorized statuses', () => {
    expect(updateOrderStatusSchema.safeParse({ status: 'refunded' }).success).toBe(false);
    expect(updateOrderStatusSchema.safeParse({ status: 'deleted' }).success).toBe(false);
  });
});
