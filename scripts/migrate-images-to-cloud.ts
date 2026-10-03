import 'dotenv/config';
import { Pool } from 'pg';
import { uploadMediaToCloudStorage } from '../src/lib/cloudStorage.ts';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL;

const isRemote =
  connectionString &&
  !connectionString.includes('localhost') &&
  !connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
});

async function migrateImagesToCloud() {
  console.log('☁️ Starting Product Image Migration to Cloudinary / Supabase Storage...');

  if (!process.env.CLOUDINARY_CLOUD_NAME && !process.env.CLOUDINARY_URL && !process.env.SUPABASE_URL) {
    console.warn('⚠️ Neither Cloudinary nor Supabase Storage credentials found in environment.');
    console.warn('Please define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET or SUPABASE_URL in your .env file.');
  }

  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, name, image, highlights FROM products ORDER BY id ASC;');
    const prods = res.rows;

    console.log(`📦 Found ${prods.length} products to check for cloud storage migration.`);

    for (const p of prods) {
      console.log(`\nProcessing Product #${p.id}: "${p.name}"`);
      console.log(`  Current Image: ${p.image}`);

      if (p.image.includes('cloudinary.com') || p.image.includes('supabase.co')) {
        console.log(`  ✓ Image already hosted on cloud storage.`);
        continue;
      }

      try {
        const uploadRes = await uploadMediaToCloudStorage({
          mediaPayload: p.image,
          filename: `product_${p.id}.jpg`,
          folder: 'ss-vastra/products',
        });

        if (uploadRes.success && uploadRes.url !== p.image) {
          await client.query('UPDATE products SET image = $1, updated_at = NOW() WHERE id = $2;', [
            uploadRes.url,
            p.id,
          ]);
          console.log(`  ✅ Successfully migrated to ${uploadRes.provider}: ${uploadRes.url}`);
        } else {
          console.log(`  ℹ️ Image maintained as: ${uploadRes.url} (${uploadRes.provider})`);
        }
      } catch (err: any) {
        console.warn(`  ⚠️ Could not upload product #${p.id} image:`, err?.message || err);
      }
    }

    console.log('\n🎉 Cloud image migration check completed!');
  } finally {
    client.release();
    await pool.end();
  }
}

migrateImagesToCloud()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
