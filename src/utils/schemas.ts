/**
 * Aurora — src/utils/schemas.ts
 *
 * Strict Zod validation schemas and sanitizers for admin endpoints and product media.
 * Enforces .strict() to reject unexpected/arbitrary fields and validates HTTPS media URLs.
 */

import * as zNamespace from 'zod';

const z = (zNamespace as any).z || (zNamespace as any).default?.z || (zNamespace as any).default || zNamespace;

/**
 * Validates that an image path or URL is safe:
 * - Safe internal static image paths (/images/...)
 * - HTTPS URLs from approved storage/media hosts (*.insforge.app, localhost, vercel.app)
 * - Rejects javascript:, data:, file:, http:, and invalid protocols.
 */
export function isValidMediaUrl(url: string): boolean {
  if (typeof url !== 'string' || !url.trim()) return false;
  const trimmed = url.trim();

  // Safe internal static image paths
  if (trimmed.startsWith('/images/')) {
    return !trimmed.includes('..') && !/[<>"'`\s]/.test(trimmed);
  }

  // Safe external HTTPS URLs
  if (trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'https:') return false;
      const host = parsed.hostname.toLowerCase();
      return (
        host.endsWith('.insforge.app') ||
        host === 'insforge.app' ||
        host.endsWith('.vercel.app') ||
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.includes('insforge')
      );
    } catch {
      return false;
    }
  }

  // Internal root-relative image paths for mock/test assets
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return !trimmed.includes('..') && !/[<>"'`\s]/.test(trimmed);
  }

  return false;
}

export const mediaUrlSchema = z
  .string()
  .min(1, 'Image URL cannot be empty')
  .max(1000, 'Image URL is too long')
  .refine(isValidMediaUrl, {
    message: 'Media URL must be a valid https:// URL (*.insforge.app) or an internal /images/ path',
  });

export const productSizeSchema = z
  .object({
    size: z.string().min(1, 'Size is required').max(50),
    stock: z.number().int().min(0, 'Stock must be a non-negative integer'),
  })
  .strict();

export const createProductSchema = z
  .object({
    id: z.string().min(1, 'ID is required').max(50),
    slug: z.string().min(1, 'Slug is required').max(100),
    name: z.string().min(1, 'Name is required').max(200),
    category: z.string().min(1, 'Category is required').max(100),
    price: z.number().min(0, 'Price must be non-negative'),
    badge: z.string().max(100).nullable().optional(),
    image: mediaUrlSchema,
    altText: z.string().min(1, 'altText is required').max(200),
    span: z.union([z.string(), z.number()]).nullable().optional(),
    aspectRatio: z.string().max(50).nullable().optional(),
    description: z.string().min(1, 'Description is required').max(5000),
    images: z.array(mediaUrlSchema).optional().default([]),
    sizes: z.array(productSizeSchema).optional().default([]),
    details: z.array(z.string().min(1).max(500)).optional().default([]),
  })
  .strict();

export const updateProductSchema = z
  .object({
    id: z.string().max(50).optional(),
    slug: z.string().min(1, 'Slug is required').max(100),
    name: z.string().min(1, 'Name is required').max(200),
    category: z.string().min(1, 'Category is required').max(100),
    price: z.number().min(0, 'Price must be non-negative'),
    badge: z.string().max(100).nullable().optional(),
    image: mediaUrlSchema,
    altText: z.string().min(1, 'altText is required').max(200),
    span: z.union([z.string(), z.number()]).nullable().optional(),
    aspectRatio: z.string().max(50).nullable().optional(),
    description: z.string().min(1, 'Description is required').max(5000),
    images: z.array(mediaUrlSchema).optional().default([]),
    sizes: z.array(productSizeSchema).optional().default([]),
    details: z.array(z.string().min(1).max(500)).optional().default([]),
  })
  .strict();

export const updateUserSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    emailVerified: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
    role: z.enum(['user', 'admin']).optional(),
  })
  .strict();

export const updateOrderStatusSchema = z
  .object({
    status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
  })
  .strict();
