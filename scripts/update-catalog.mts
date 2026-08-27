/**
 * update-catalog.mts
 * ==================
 *
 * All-rounder catalog management script.
 * Can sync full catalog, add new products, or delete products interactively.
 * Auto-synchronizes local src/data/*.ts and updates the InsForge database/storage
 * across all five buckets (product-media, lookbook-media, editorial-media, material-media, category-media).
 *
 * Usage:
 *   bun scripts/update-catalog.mts
 */

import { createAdminClient } from '@insforge/sdk';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';

// Reads definitions
import { heroProducts, featuredProducts, allProducts, type Product } from '../src/data/products';
import { lookbookSlides } from '../src/data/lookbook';
import { editorialItems } from '../src/data/editorial';
import { materials } from '../src/data/materials';
import { categoryDataList } from '../src/data/categories';

// ════════════════════════════════════════════════════════
//  Interactive Input Helpers
// ════════════════════════════════════════════════════════

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans.trim());
  }));
}

// ════════════════════════════════════════════════════════
//  Credential loading
// ════════════════════════════════════════════════════════

const projectJsonPath = path.resolve(process.cwd(), '.insforge', 'project.json');
const dotenvPath = path.resolve(process.cwd(), '.env.local');

if (!fs.existsSync(projectJsonPath)) {
  console.error(
    "Error: .insforge/project.json not found.\n" +
    "Run `bunx @insforge/cli create` or `bunx @insforge/cli link` first."
  );
  process.exit(1);
}

const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
const ossHost: string = projectJson.oss_host;
const apiKey: string = projectJson.api_key;

if (fs.existsSync(dotenvPath)) {
  const envConfig = fs.readFileSync(dotenvPath, 'utf-8');
  for (const line of envConfig.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      value = value.trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Error: DATABASE_URL not found in .env.local");
  process.exit(1);
}

// ════════════════════════════════════════════════════════
//  Serialization helper to sync src/data/products.ts
// ════════════════════════════════════════════════════════

function serializeProduct(p: Product): string {
  return `  {
    id: ${JSON.stringify(p.id)},
    slug: ${JSON.stringify(p.slug)},
    name: ${JSON.stringify(p.name)},
    category: ${JSON.stringify(p.category)},
    price: ${p.price},
    ${p.badge ? `badge: ${JSON.stringify(p.badge)},` : ''}
    image: ${JSON.stringify(p.image)},
    images: ${JSON.stringify(p.images || [p.image])},
    altText: ${JSON.stringify(p.altText)},
    ${p.span ? `span: ${JSON.stringify(p.span)},` : ''}
    ${p.aspectRatio ? `aspectRatio: ${JSON.stringify(p.aspectRatio)},` : ''}
    ${p.description ? `description: ${JSON.stringify(p.description)},` : ''}
    ${p.details ? `details: ${JSON.stringify(p.details)},` : ''}
    sizes: ${JSON.stringify(p.sizes || [])},
  }`;
}

function saveProductsLocal(hero: Product[], featured: Product[], all: Product[]) {
  const filePath = path.resolve(process.cwd(), 'src', 'data', 'products.ts');
  const content = `export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  badge?: string;
  image: string;
  images?: string[];
  altText: string;
  span?: string;
  aspectRatio?: string;
  description?: string;
  details?: string[];
  sizes?: string[];
}

export { categories, type Category } from "./categories";

const sizeOptions = {
  apparel: ["XS", "S", "M", "L", "XL"],
  accessories: ["One Size"],
};

export const heroProducts: Product[] = [
${hero.map(serializeProduct).join(',\n')}
];

export const featuredProducts: Product[] = [
${featured.map(serializeProduct).join(',\n')}
];

export const allProducts: Product[] = [
${all.map(serializeProduct).join(',\n')}
];
`;
  fs.writeFileSync(filePath, content, 'utf-8');
}

// ════════════════════════════════════════════════════════
//  Buckets Configuration
// ════════════════════════════════════════════════════════

const BUCKET = 'product-media';

const BUCKETS = {
  products: 'product-media',
  lookbook: 'lookbook-media',
  editorial: 'editorial-media',
  materials: 'material-media',
  categories: 'category-media',
};

function getBucketAndKey(localRelPath: string): { bucket: string; storageKey: string } {
  if (localRelPath.startsWith('/images/lookbook/')) {
    return {
      bucket: BUCKETS.lookbook,
      storageKey: localRelPath.replace(/^\/images\/lookbook\//, ''),
    };
  } else if (localRelPath.startsWith('/images/editorial/')) {
    return {
      bucket: BUCKETS.editorial,
      storageKey: localRelPath.replace(/^\/images\/editorial\//, ''),
    };
  } else if (localRelPath.startsWith('/images/materials/')) {
    return {
      bucket: BUCKETS.materials,
      storageKey: localRelPath.replace(/^\/images\/materials\//, ''),
    };
  } else if (localRelPath.startsWith('/images/categories/')) {
    return {
      bucket: BUCKETS.categories,
      storageKey: localRelPath.replace(/^\/images\/categories\//, ''),
    };
  } else {
    const key = localRelPath.replace(/^\/images\//, '');
    return {
      bucket: BUCKETS.products,
      storageKey: key,
    };
  }
}

function buildStorageUrl(bucketName: string, bucketKey: string): string {
  const encodedKey = bucketKey.split('/').map(encodeURIComponent).join('%2F');
  return `${ossHost}/api/storage/buckets/${bucketName}/objects/${encodedKey}`;
}

function getStorageKeyFromUrl(url: string, bucketName: string = 'product-media'): string | null {
  if (!url) return null;
  const prefix = `/api/storage/buckets/${bucketName}/objects/`;
  const index = url.indexOf(prefix);
  if (index !== -1) {
    const encodedKey = url.substring(index + prefix.length).split('?')[0];
    try {
      return decodeURIComponent(encodedKey);
    } catch {
      return encodedKey;
    }
  }
  if (url.startsWith('/images/')) {
    return url.replace(/^\/images\//, '');
  }
  return null;
}

async function ensureBucketsExist(_admin: ReturnType<typeof createAdminClient>): Promise<void> {
  const bucketsList = execSync(`bunx @insforge/cli storage buckets`, { encoding: 'utf-8' });

  for (const bucketName of Object.values(BUCKETS)) {
    if (bucketsList.includes(bucketName)) {
      console.log(`  Bucket "${bucketName}" exists.`);
    } else {
      console.log(`  Bucket "${bucketName}" not found. Creating...`);
      try {
        const createOut = execSync(`bunx @insforge/cli storage create-bucket ${bucketName}`, { encoding: 'utf-8' });
        console.log(`  ${createOut.trim()}`);
      } catch (err: any) {
        console.error(`  Failed to create bucket "${bucketName}":`, err.message || err);
        process.exit(1);
      }
    }
  }
}

// ════════════════════════════════════════════════════════
//  Storage Upload and Overwrite
// ════════════════════════════════════════════════════════

async function uploadAndOverwriteImage(
  admin: ReturnType<typeof createAdminClient>,
  localRelPath: string,
  existingKeys: Record<string, Set<string>>,
): Promise<string> {
  const fullPath = path.resolve(process.cwd(), 'public', localRelPath.replace(/^\//, ''));
  const { bucket, storageKey } = getBucketAndKey(localRelPath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`  Warning: Local file not found: ${fullPath}. Database will use raw path placeholder.`);
    return buildStorageUrl(bucket, storageKey);
  }

  if (existingKeys[bucket]?.has(storageKey)) {
    console.log(`  Asset already exists in "${bucket}": "${storageKey}". Skipping upload.`);
    return buildStorageUrl(bucket, storageKey);
  }

  const buffer = fs.readFileSync(fullPath);
  const blob = new Blob([buffer], { type: 'image/webp' });

  console.log(`  Uploading to "${bucket}": "${storageKey}"`);
  const { data, error } = await admin.storage.from(bucket).upload(storageKey, blob);

  if (error) {
    console.warn(`  Warning: upload error for "${storageKey}" in "${bucket}", using fallback. Details:`, error.message);
    return buildStorageUrl(bucket, storageKey);
  }

  return data?.url || buildStorageUrl(bucket, storageKey);
}

// ════════════════════════════════════════════════════════
//  Operations
// ════════════════════════════════════════════════════════

async function getExistingKeys(admin: ReturnType<typeof createAdminClient>): Promise<Record<string, Set<string>>> {
  const existingKeys: Record<string, Set<string>> = {};
  for (const bucketName of Object.values(BUCKETS)) {
    existingKeys[bucketName] = new Set<string>();
    try {
      const { data: listData } = await admin.storage.from(bucketName).list({ limit: 1000 });
      const objects = (listData as any)?.data || (listData as any)?.objects || [];
      for (const obj of objects) {
        existingKeys[bucketName].add(obj.key);
      }
    } catch (err: any) {
      console.warn(`Warning pre-populating keys for "${bucketName}": ${err.message || err}`);
    }
  }
  return existingKeys;
}

async function uploadCatalogImages(
  admin: ReturnType<typeof createAdminClient>,
  productsList: Product[],
  lookbookList: typeof lookbookSlides = [],
  editorialList: typeof editorialItems = [],
  materialsList: typeof materials = [],
  categoryList: typeof categoryDataList = [],
) {
  const existingKeys = await getExistingKeys(admin);
  const urlMap = new Map<string, string>();

  // Gather unique image paths
  const imagePaths = new Set<string>();
  for (const p of productsList) {
    if (p.image) imagePaths.add(p.image);
    if (p.images) {
      for (const img of p.images) {
        imagePaths.add(img);
      }
    }
  }
  for (const s of lookbookList) {
    if (s.originalImage) imagePaths.add(s.originalImage);
  }
  for (const e of editorialList) {
    if (e.originalImage) imagePaths.add(e.originalImage);
  }
  for (const cat of categoryList) {
    if (cat.image) imagePaths.add(cat.image);
  }
  for (const mat of materialsList) {
    if (mat.image) imagePaths.add(mat.image);
  }

  console.log(`Syncing ${imagePaths.size} media assets in parallel...`);
  await Promise.all(
    Array.from(imagePaths).map(async (imgPath) => {
      const url = await uploadAndOverwriteImage(admin, imgPath, existingKeys);
      urlMap.set(imgPath, url);
    })
  );
  return urlMap;
}

async function syncProductToDb(client: Client, product: Product, urlMap: Map<string, string>) {
  const imageUrl = urlMap.get(product.image) || product.image;
  console.log(`Syncing product: "${product.name}" (ID: ${product.id})`);

  const { rows } = await client.query('SELECT 1 FROM products WHERE id = $1', [product.id]);
  const exists = rows.length > 0;

  if (exists) {
    console.log(`  -> Existing product. Running UPDATE for "${product.name}" in database...`);
    await client.query(
      `UPDATE products SET 
        slug = $1, name = $2, category = $3, price = $4, badge = $5, 
        image = $6, alt_text = $7, span = $8, aspect_ratio = $9, description = $10
      WHERE id = $11`,
      [
        product.slug, product.name, product.category, product.price, product.badge || null,
        imageUrl, product.altText, product.span || null, product.aspectRatio || null,
        product.description, product.id
      ]
    );
  } else {
    console.log(`  -> New product. Running INSERT for "${product.name}" in database...`);
    await client.query(
      `INSERT INTO products (
        id, slug, name, category, price, badge, image, alt_text, span, aspect_ratio, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        product.id, product.slug, product.name, product.category, product.price, product.badge || null,
        imageUrl, product.altText, product.span || null, product.aspectRatio || null, product.description
      ]
    );
  }

  await client.query('DELETE FROM product_images WHERE product_id = $1', [product.id]);
  await client.query('DELETE FROM product_sizes WHERE product_id = $1', [product.id]);
  await client.query('DELETE FROM product_details WHERE product_id = $1', [product.id]);

  const images = product.images?.map((p) => urlMap.get(p) || p) ?? [];
  const sizes = product.sizes ?? [];
  const details = product.details ?? [];

  if (images.length > 0) {
    const imgParams = images.map((_, i) => `($1, $${i + 2})`).join(', ');
    await client.query(
      `INSERT INTO product_images (product_id, image_url) VALUES ${imgParams}`,
      [product.id, ...images]
    );
  }

  if (sizes.length > 0) {
    const szParams: any[] = [product.id];
    const szPlaceholders = sizes.map((s) => {
      szParams.push(s, 10);
      return `($1, $${szParams.length - 1}, $${szParams.length})`;
    }).join(', ');
    await client.query(
      `INSERT INTO product_sizes (product_id, size, stock) VALUES ${szPlaceholders}`,
      szParams
    );
  }

  if (details.length > 0) {
    const detParams = details.map((_, i) => `($1, $${i + 2})`).join(', ');
    await client.query(
      `INSERT INTO product_details (product_id, detail) VALUES ${detParams}`,
      [product.id, ...details]
    );
  }
}

// ════════════════════════════════════════════════════════
//  Interactive Actions
// ════════════════════════════════════════════════════════

async function addProductInteractively() {
  console.log("\n--- ADD NEW PRODUCTS FROM LOCAL CONFIG ---");
  console.log("Connecting to database to check for existing products...");
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const { rows } = await client.query('SELECT id FROM products');
  const dbIds = new Set(rows.map(r => r.id));

  // Gather unique local products
  const productMap = new Map<string, Product>();
  function addProducts(products: Product[]) {
    for (const p of products) {
      const existing = productMap.get(p.slug);
      if (existing) {
        if (existing.id.startsWith('h') && !p.id.startsWith('h')) {
          productMap.set(p.slug, p);
        }
      } else {
        productMap.set(p.slug, p);
      }
    }
  }
  addProducts(heroProducts);
  addProducts(featuredProducts);
  addProducts(allProducts);
  const uniqueProducts = Array.from(productMap.values());

  // Compare and find missing ones
  const newProducts = uniqueProducts.filter(p => !dbIds.has(p.id));

  if (newProducts.length === 0) {
    console.log("No new products found in local definitions compared to the database.");
    await client.end();
    return;
  }

  console.log(`\nFound ${newProducts.length} new product(s) in local config that are missing from the database:`);
  newProducts.forEach((p) => {
    console.log(`  - ID: ${p.id} | Name: ${p.name} | Category: ${p.category} | Price: $${p.price}`);
  });

  const confirm = await askQuestion("\nDo you want to upload their images and insert them into the database? (y/N): ");
  if (confirm.toLowerCase() !== 'y') {
    console.log("Operation cancelled.");
    await client.end();
    return;
  }

  console.log("\nInitializing InsForge client and verifying storage buckets...");
  const admin = createAdminClient({ baseUrl: ossHost, apiKey });
  await ensureBucketsExist(admin);

  console.log("Uploading images...");
  const urlMap = await uploadCatalogImages(admin, newProducts, [], [], [], []);

  console.log("Inserting products into the database...");
  for (const product of newProducts) {
    await syncProductToDb(client, product, urlMap);
  }

  await client.end();
  console.log("\nSuccessfully added new product(s) to the database and storage!");
}



async function deleteProductInteractively() {
  console.log("\n--- DELETE PRODUCT ---");
  const allMerged = Array.from(new Map([...allProducts, ...heroProducts, ...featuredProducts].map(p => [p.id, p])).values());

  if (allMerged.length === 0) {
    console.log("No products available to delete.");
    return;
  }

  console.log("Available Products:");
  allMerged.forEach((p, idx) => {
    console.log(`  [${idx + 1}] ID: ${p.id} | ${p.name} (${p.category})`);
  });

  const choiceInput = await askQuestion(`Select product to DELETE (1-${allMerged.length}): `);
  const choiceIdx = parseInt(choiceInput) - 1;
  if (isNaN(choiceIdx) || choiceIdx < 0 || choiceIdx >= allMerged.length) {
    console.error("Invalid choice.");
    return;
  }

  const target = allMerged[choiceIdx];
  const confirm = await askQuestion(`Are you sure you want to delete ${target.name} (${target.id})? (y/N): `);
  if (confirm.toLowerCase() !== 'y') {
    console.log("Deletion cancelled.");
    return;
  }

  // Remove from arrays
  const filterList = (list: Product[]) => list.filter(p => p.id !== target.id);
  const newAll = filterList(allProducts);
  const newHero = filterList(heroProducts);
  const newFeatured = filterList(featuredProducts);

  // 1. Save locally
  saveProductsLocal(newHero, newFeatured, newAll);
  console.log(`\nSuccessfully deleted from local definition file.`);

  // 2. Wipe associated storage images + delete from DB
  console.log("\nConnecting to database...");
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  // Gather all image URLs for this product
  const imageUrls = new Set<string>();
  const { rows: productRows } = await client.query('SELECT image FROM products WHERE id = $1', [target.id]);
  if (productRows.length > 0 && productRows[0].image) {
    imageUrls.add(productRows[0].image);
  }
  const { rows: galleryRows } = await client.query('SELECT image_url FROM product_images WHERE product_id = $1', [target.id]);
  for (const row of galleryRows) {
    if (row.image_url) imageUrls.add(row.image_url);
  }

  // Remove orphaned storage keys
  const admin = createAdminClient({ baseUrl: ossHost, apiKey });
  console.log(`Checking storage usage for ${imageUrls.size} asset(s)...`);
  for (const url of imageUrls) {
    const { rows: usageRows } = await client.query(
      `SELECT COUNT(*) as count FROM (
        SELECT 1 FROM products WHERE image = $1 AND id <> $2
        UNION ALL
        SELECT 1 FROM product_images WHERE image_url = $1 AND product_id <> $2
      ) as usages`,
      [url, target.id]
    );
    const count = parseInt(usageRows[0].count, 10);
    if (count === 0) {
      const bucketName = Object.values(BUCKETS).find((b) => url.includes(`/api/storage/buckets/${b}/`)) || BUCKET;
      const storageKey = getStorageKeyFromUrl(url, bucketName);
      if (storageKey) {
        console.log(`  Deleting unused storage key: "${storageKey}" from "${bucketName}"...`);
        const { error } = await admin.storage.from(bucketName).remove(storageKey);
        if (error) {
          console.warn(`  Warning: failed to delete "${storageKey}" from storage:`, error.message);
        } else {
          console.log(`  ✓ Wiped from storage.`);
        }
      }
    } else {
      console.log(`  Skipping storage deletion for "${url}" (used by ${count} other product(s)).`);
    }
  }

  await client.query('DELETE FROM products WHERE id = $1', [target.id]);
  await client.end();

  console.log(`\n=== Success! Product "${target.name}" (ID: ${target.id}) and its unused media have been wiped. ===`);
}

async function runSyncCatalog() {
  console.log("\n=== Operation: Full Catalog Sync ===");
  const admin = createAdminClient({ baseUrl: ossHost, apiKey });

  // Verify all storage buckets exist before proceeding
  console.log("\n=== Phase 1: Verifying storage buckets ===");
  await ensureBucketsExist(admin);

  // Gather unique products
  const productMap = new Map<string, Product>();
  function addProducts(products: Product[]) {
    for (const p of products) {
      const existing = productMap.get(p.slug);
      if (existing) {
        if (existing.id.startsWith('h') && !p.id.startsWith('h')) {
          productMap.set(p.slug, p);
        }
      } else {
        productMap.set(p.slug, p);
      }
    }
  }
  addProducts(heroProducts);
  addProducts(featuredProducts);
  addProducts(allProducts);
  const uniqueProducts = Array.from(productMap.values());

  console.log("\n=== Phase 2: Uploading and syncing media assets ===");
  const urlMap = await uploadCatalogImages(admin, uniqueProducts, lookbookSlides, editorialItems, materials, categoryDataList);

  console.log("\n=== Phase 3: Connecting to database ===");
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  console.log("\n=== Phase 4: Syncing categories ===");
  for (const cat of categoryDataList) {
    const imageUrl = urlMap.get(cat.image) || cat.image;
    console.log(`Syncing category: "${cat.name}"`);

    const { rows } = await client.query('SELECT 1 FROM categories WHERE slug = $1', [cat.slug]);
    if (rows.length > 0) {
      console.log(`  -> Category "${cat.name}" exists. Running UPDATE...`);
      await client.query(
        `UPDATE categories SET name = $1, image = $2, description = $3 WHERE slug = $4`,
        [cat.name, imageUrl, cat.description, cat.slug]
      );
    } else {
      console.log(`  -> Category "${cat.name}" is new. Running INSERT...`);
      await client.query(
        `INSERT INTO categories (slug, name, image, description) VALUES ($1, $2, $3, $4)`,
        [cat.slug, cat.name, imageUrl, cat.description]
      );
    }
  }

  console.log("\n=== Phase 5: Syncing products and details ===");
  for (const product of uniqueProducts) {
    await syncProductToDb(client, product, urlMap);
  }

  console.log("\n=== Phase 6: Syncing lookbook slides ===");
  for (const slide of lookbookSlides) {
    const imageUrl = urlMap.get(slide.originalImage) || slide.originalImage;
    console.log(`Syncing lookbook slide: ${slide.slideNumber}`);

    const { rows } = await client.query('SELECT 1 FROM lookbook_slides WHERE slide_number = $1', [slide.slideNumber]);
    if (rows.length > 0) {
      console.log(`  -> Slide ${slide.slideNumber} exists. Running UPDATE...`);
      await client.query(
        `UPDATE lookbook_slides SET original_image = $1, image_url = $2, alt_text = $3, tag = $4, title = $5, link = $6
         WHERE slide_number = $7`,
        [slide.originalImage, imageUrl, slide.altText, slide.tag || null, slide.title || null, slide.link || null, slide.slideNumber]
      );
    } else {
      console.log(`  -> Slide ${slide.slideNumber} is new. Running INSERT...`);
      await client.query(
        `INSERT INTO lookbook_slides (slide_number, original_image, image_url, alt_text, tag, title, link)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [slide.slideNumber, slide.originalImage, imageUrl, slide.altText, slide.tag || null, slide.title || null, slide.link || null]
      );
    }
  }

  console.log("\n=== Phase 7: Syncing editorial content ===");
  for (const item of editorialItems) {
    const imageUrl = urlMap.get(item.originalImage) || item.originalImage;
    console.log(`Syncing editorial item: "${item.id}"`);

    const { rows } = await client.query('SELECT 1 FROM editorial_content WHERE id = $1', [item.id]);
    if (rows.length > 0) {
      console.log(`  -> Editorial item "${item.id}" exists. Running UPDATE...`);
      await client.query(
        `UPDATE editorial_content SET original_image = $1, image_url = $2, alt_text = $3, title = $4, description = $5
         WHERE id = $6`,
        [item.originalImage, imageUrl, item.altText, item.title, item.description || null, item.id]
      );
    } else {
      console.log(`  -> Editorial item "${item.id}" is new. Running INSERT...`);
      await client.query(
        `INSERT INTO editorial_content (id, original_image, image_url, alt_text, title, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [item.id, item.originalImage, imageUrl, item.altText, item.title, item.description || null]
      );
    }
  }

  console.log("\n=== Phase 8: Syncing materials ===");
  for (const mat of materials) {
    const imageUrl = urlMap.get(mat.image) || mat.image;
    console.log(`Syncing material: "${mat.name}"`);

    const { rows } = await client.query('SELECT 1 FROM materials WHERE name = $1', [mat.name]);
    if (rows.length > 0) {
      console.log(`  -> Material "${mat.name}" exists. Running UPDATE...`);
      await client.query(
        `UPDATE materials SET source = $1, original_image = $2, image_url = $3, description = $4, properties = $5
         WHERE name = $6`,
        [mat.source, mat.image, imageUrl, mat.description, mat.properties, mat.name]
      );
    } else {
      console.log(`  -> Material "${mat.name}" is new. Running INSERT...`);
      await client.query(
        `INSERT INTO materials (name, source, original_image, image_url, description, properties)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [mat.name, mat.source, mat.image, imageUrl, mat.description, mat.properties]
      );
    }
  }

  await client.end();
  console.log("\n=== Success! Full Catalog update complete. ===");
}

// ════════════════════════════════════════════════════════
//  Main Run Menu
// ════════════════════════════════════════════════════════

async function main() {
  console.log("=========================================");
  console.log("  AURORA INTERACTIVE CATALOG MANAGER     ");
  console.log("=========================================");
  console.log("Choose the operation to perform:");
  console.log("  1. Sync full catalog from files to Database & Storage");
  console.log("  2. Add a new product interactively");
  console.log("  3. Delete a product interactively");
  console.log("  4. Exit");

  const choice = await askQuestion("\nEnter option (1-4): ");
  if (choice === "1") {
    await runSyncCatalog();
  } else if (choice === "2") {
    await addProductInteractively();
  } else if (choice === "3") {
    await deleteProductInteractively();
  } else {
    console.log("Exiting.");
  }
}

main().catch((err) => {
  console.error("Operation failed:", err);
  process.exit(1);
});
