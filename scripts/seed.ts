import 'dotenv/config';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️ No DATABASE_URL or POSTGRES_URL found in environment.');
  console.warn('Set DATABASE_URL in your .env file (Neon or Supabase connection string).');
  console.warn('Example: DATABASE_URL="postgresql://user:password@ep-xyz.region.neon.tech/neondb?sslmode=require"');
}

const isRemote =
  connectionString &&
  !connectionString.includes('localhost') &&
  !connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString: connectionString || undefined,
  host: !connectionString ? (process.env.SQL_HOST || 'localhost') : undefined,
  user: !connectionString ? (process.env.SQL_USER || 'postgres') : undefined,
  password: !connectionString ? (process.env.SQL_PASSWORD || '') : undefined,
  database: !connectionString ? (process.env.SQL_DB_NAME || 'postgres') : undefined,
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
});

export async function runDatabaseMigrationsAndSeed() {
  console.log('🚀 Connecting to PostgreSQL Database...');
  const client = await pool.connect();

  try {
    console.log('📦 Step 1: Creating database tables for products, orders, customers, reviews...');

    // 1. Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price INTEGER NOT NULL,
        original_price INTEGER NOT NULL,
        discount_percent INTEGER NOT NULL DEFAULT 0,
        sizes TEXT NOT NULL,
        stock INTEGER NOT NULL DEFAULT 50,
        image TEXT NOT NULL,
        description TEXT NOT NULL,
        fabric TEXT,
        color TEXT,
        highlights TEXT,
        is_new_arrival BOOLEAN DEFAULT FALSE,
        is_best_seller BOOLEAN DEFAULT FALSE,
        is_featured BOOLEAN DEFAULT FALSE,
        is_spotlight BOOLEAN DEFAULT FALSE,
        is_outfit BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. Customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        email TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        pincode TEXT,
        total_orders INTEGER NOT NULL DEFAULT 0,
        total_spent INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 3. Orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number TEXT NOT NULL UNIQUE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        shipping_address TEXT NOT NULL,
        city TEXT NOT NULL DEFAULT 'Jaipur',
        state TEXT NOT NULL DEFAULT 'Rajasthan',
        pincode TEXT NOT NULL DEFAULT '303905',
        total_amount INTEGER NOT NULL,
        discount_amount INTEGER DEFAULT 0,
        coupon_code TEXT,
        payment_method TEXT NOT NULL DEFAULT 'cod',
        payment_status TEXT NOT NULL DEFAULT 'pending',
        order_status TEXT NOT NULL DEFAULT 'Placed',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 4. Order Items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        product_name TEXT NOT NULL,
        product_image TEXT,
        size TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price INTEGER NOT NULL,
        total_price INTEGER NOT NULL
      );
    `);

    // 5. Reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        product_name TEXT,
        author TEXT NOT NULL,
        city TEXT DEFAULT 'Jaipur',
        rating INTEGER NOT NULL DEFAULT 5,
        title TEXT,
        comment TEXT NOT NULL,
        is_verified BOOLEAN DEFAULT TRUE,
        is_approved BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 6. Categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        icon TEXT,
        image TEXT,
        description TEXT,
        display_order INTEGER DEFAULT 0
      );
    `);

    // 7. Settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        description TEXT
      );
    `);

    // 8. Admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        admin_id TEXT NOT NULL UNIQUE,
        email TEXT,
        phone TEXT,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'staff',
        is_active BOOLEAN DEFAULT TRUE,
        must_change_password BOOLEAN DEFAULT FALSE,
        failed_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Step 1 Complete: Tables created or already existing.');

    // -------------------------------------------------------------
    // Step 2: Seed the 4 Existing Products
    // -------------------------------------------------------------
    console.log('🌸 Step 2: Seeding the 4 existing real products into PostgreSQL...');

    const productsToSeed = [
      {
        id: 9,
        slug: 'teal-embroidered-kurta-pant-dupatta-suit-set-858',
        name: 'Teal Embroidered Kurta Pant & Dupatta Suit Set',
        category: 'Kurta Sets',
        price: 999,
        original_price: 1999,
        discount_percent: 50,
        sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
        stock: 100,
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        description:
          'Teal Embroidered Kurta Pant & Dupatta Suit Set — SS VASTRA\n\nElevate your ethnic wardrobe with this elegant teal suit set from SS VASTRA. The outfit features beautiful floral detailing, an embroidered neckline and a matching embroidered dupatta for a graceful and sophisticated look.\n\nSet Includes: Kurta + Pant + Dupatta\nColor: Teal\nDesign: Floral Embroidery\nStyle: Elegant Ethnic Wear',
        fabric: 'Pure Cambric Cotton 60s',
        color: 'Teal Blue',
        highlights: JSON.stringify([
          'Elegant Teal Shade',
          'Embroidered Neckline',
          'Comfortable 3-Piece Set',
          'Matching Dupatta',
        ]),
        is_new_arrival: true,
        is_best_seller: false,
        is_featured: true,
        is_spotlight: true,
        is_outfit: true,
        is_active: true,
      },
      {
        id: 10,
        slug: 'peach-embroidered-kurta-pant-dupatta-suit-set-576',
        name: 'Peach Embroidered Kurta Pant & Dupatta Suit Set',
        category: 'Kurta Sets',
        price: 999,
        original_price: 1999,
        discount_percent: 50,
        sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
        stock: 100,
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
        description:
          'Peach Embroidered 3-Piece Suit Set — SS VASTRA\n\nAdd a touch of elegance to your ethnic wardrobe with this beautiful peach embroidered suit set. The kurta features intricate embroidery around the neckline and elegant detailing along the hem and sleeves. Paired with a matching pant and a graceful embroidered-border dupatta, this outfit creates a sophisticated traditional look.',
        fabric: 'Pure Cotton mulmul',
        color: 'Pastel Peach',
        highlights: JSON.stringify([
          'Pure Cotton Mulmul',
          'Intricate Neckline Embroidery',
          'Matching Straight Pant',
          'Graceful Dupatta',
        ]),
        is_new_arrival: true,
        is_best_seller: false,
        is_featured: true,
        is_spotlight: true,
        is_outfit: true,
        is_active: true,
      },
      {
        id: 11,
        slug: 'red-floral-embroidered-kurta-pant-set-with-dupatta-519',
        name: 'Red Floral Embroidered Kurta Pant Set with Dupatta',
        category: 'Kurta Sets',
        price: 999,
        original_price: 2999,
        discount_percent: 67,
        sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
        stock: 99,
        image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
        description:
          'Red Floral Embroidered 3-Piece Suit Set — SS VASTRA\n\nElevate your ethnic wardrobe with this elegant red embroidered suit set from SS VASTRA. Featuring beautiful multicolor floral embroidery, a graceful V-neckline, detailed sleeves and a matching embroidered dupatta, this outfit combines traditional charm with a modern silhouette.\n\nSet Includes: Kurta, Pant & Dupatta\nFabric: Premium Cotton Blend\nColor: Red / Rani Red',
        fabric: 'Premium Cotton Blend',
        color: 'Red / Rani Red',
        highlights: JSON.stringify([
          'Multicolor Floral Embroidery',
          'Graceful V-Neckline',
          'Matching Embroidered Dupatta',
          'Pure Fabric',
        ]),
        is_new_arrival: true,
        is_best_seller: true,
        is_featured: true,
        is_spotlight: true,
        is_outfit: true,
        is_active: true,
      },
      {
        id: 12,
        slug: 'olive-green-embroidered-3-piece-suit-set-977',
        name: 'Olive Green Embroidered 3-Piece Suit Set',
        category: 'Kurta Sets',
        price: 999,
        original_price: 1999,
        discount_percent: 50,
        sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL', '3XL']),
        stock: 100,
        image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80',
        description:
          'Royal olive green elegance with delicate embroidery and a graceful dupatta — a timeless ethnic look by SS VASTRA. ✨\n\nAvailable Sizes: S, M, L, XL, XXL, 3XL\nFit: Regular Fit\nLength: Long Kurta\nBottom: Straight Fit Pants\nSleeves: 3/4 Sleeves',
        fabric: 'Premium Rayon Blend',
        color: 'Olive Green with Gold Embroidery',
        highlights: JSON.stringify([
          'Delicate Gold Embroidery',
          '3-Piece Festive Set',
          'Straight Fit Pants',
          'Fast Dispatch',
        ]),
        is_new_arrival: true,
        is_best_seller: true,
        is_featured: true,
        is_spotlight: true,
        is_outfit: true,
        is_active: true,
      },
    ];

    for (const p of productsToSeed) {
      await client.query(
        `
        INSERT INTO products (
          id, slug, name, category, price, original_price, discount_percent,
          sizes, stock, image, description, fabric, color, highlights,
          is_new_arrival, is_best_seller, is_featured, is_spotlight, is_outfit, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          price = EXCLUDED.price,
          original_price = EXCLUDED.original_price,
          discount_percent = EXCLUDED.discount_percent,
          sizes = EXCLUDED.sizes,
          stock = EXCLUDED.stock,
          image = EXCLUDED.image,
          description = EXCLUDED.description,
          fabric = EXCLUDED.fabric,
          color = EXCLUDED.color,
          highlights = EXCLUDED.highlights,
          is_new_arrival = EXCLUDED.is_new_arrival,
          is_best_seller = EXCLUDED.is_best_seller,
          is_featured = EXCLUDED.is_featured,
          is_spotlight = EXCLUDED.is_spotlight,
          is_outfit = EXCLUDED.is_outfit,
          is_active = EXCLUDED.is_active;
      `,
        [
          p.id,
          p.slug,
          p.name,
          p.category,
          p.price,
          p.original_price,
          p.discount_percent,
          p.sizes,
          p.stock,
          p.image,
          p.description,
          p.fabric,
          p.color,
          p.highlights,
          p.is_new_arrival,
          p.is_best_seller,
          p.is_featured,
          p.is_spotlight,
          p.is_outfit,
          p.is_active,
        ]
      );
      console.log(`  ✓ Product #${p.id} synced: "${p.name}"`);
    }

    // -------------------------------------------------------------
    // Step 3: Seed Customer Reviews
    // -------------------------------------------------------------
    console.log('⭐ Step 3: Seeding customer reviews for existing products...');
    const initialReviews = [
      {
        product_id: 9,
        product_name: 'Teal Embroidered Kurta Pant & Dupatta Suit Set',
        author: 'Pooja Sharma',
        city: 'Jaipur',
        rating: 5,
        title: 'Authentic Sanganeri Craftsmanship',
        comment:
          'SS VASTRA ka Teal suit kapda bohot hi mulayam aur comfortable hai. Finishing bilkul boutique jaisi mili.',
      },
      {
        product_id: 10,
        product_name: 'Peach Embroidered Kurta Pant & Dupatta Suit Set',
        author: 'Anjali Verma',
        city: 'Delhi NCR',
        rating: 5,
        title: 'Graceful Color & Fast Delivery',
        comment:
          'Peach suit ka color shade aur embroidery exact photo jaisi aayi. Delivery Delhi me 3 din me ho gayi.',
      },
      {
        product_id: 11,
        product_name: 'Red Floral Embroidered Kurta Pant Set with Dupatta',
        author: 'Neha Meena',
        city: 'Jaipur',
        rating: 5,
        title: 'Festive Wear Perfection',
        comment:
          'Rani red embroidery dupatta ke saath look bohot sundar lagta hai. Sanganer craft direct milna badi baat hai.',
      },
      {
        product_id: 12,
        product_name: 'Olive Green Embroidered 3-Piece Suit Set',
        author: 'Sunita Rathore',
        city: 'Jodhpur',
        rating: 5,
        title: 'Pure Cambric Quality & Perfect Fit',
        comment:
          'Fitting एकदम perfect aayi. Packaging bhi premium thi aur COD smoothly receive hua.',
      },
    ];

    for (const r of initialReviews) {
      await client.query(
        `
        INSERT INTO reviews (product_id, product_name, author, city, rating, title, comment, is_verified, is_approved)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, true)
        ON CONFLICT DO NOTHING;
      `,
        [r.product_id, r.product_name, r.author, r.city, r.rating, r.title, r.comment]
      );
    }
    console.log('✅ Step 3 Complete: Customer reviews seeded.');

    // -------------------------------------------------------------
    // Step 4: Seed Initial Customers
    // -------------------------------------------------------------
    console.log('👥 Step 4: Seeding initial customers...');
    const initialCustomers = [
      {
        name: 'Pooja Sharma',
        phone: '9829012345',
        email: 'pooja.sharma@example.com',
        address: 'Malviya Nagar, Sector 3',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302017',
        total_orders: 1,
        total_spent: 999,
      },
      {
        name: 'Anjali Verma',
        phone: '9810123456',
        email: 'anjali.v@example.com',
        address: 'Greater Kailash 1',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110048',
        total_orders: 1,
        total_spent: 999,
      },
    ];

    for (const c of initialCustomers) {
      await client.query(
        `
        INSERT INTO customers (name, phone, email, address, city, state, pincode, total_orders, total_spent)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (phone) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          address = EXCLUDED.address;
      `,
        [c.name, c.phone, c.email, c.address, c.city, c.state, c.pincode, c.total_orders, c.total_spent]
      );
    }
    console.log('✅ Step 4 Complete: Customers table seeded.');

    // -------------------------------------------------------------
    // Step 5: Seed Super Admin
    // -------------------------------------------------------------
    console.log('🛡️ Step 5: Seeding Super Admin account in PostgreSQL...');
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'contact@ssvastra.com').toLowerCase();
    const superAdminPass = process.env.SUPER_ADMIN_PASSWORD || 'Meena9829@';
    const hash = await bcrypt.hash(superAdminPass, 10);

    await client.query(
      `
      INSERT INTO admins (admin_id, email, phone, password_hash, name, role, is_active, must_change_password)
      VALUES ($1, $2, $3, $4, $5, 'super_admin', true, false)
      ON CONFLICT (admin_id) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        email = EXCLUDED.email;
    `,
      ['1000', superAdminEmail, '9783770735', hash, 'Subhash Meena (SS VASTRA Owner)']
    );

    console.log(`✅ Step 5 Complete: Super admin account configured (${superAdminEmail} / adminId: 1000).`);

    // -------------------------------------------------------------
    // Step 6: Seed Store Settings
    // -------------------------------------------------------------
    console.log('⚙️ Step 6: Seeding store settings...');
    const defaultSettings: [string, string][] = [
      ['store_name', 'SS VASTRA'],
      ['tagline', 'Elegance in Every Thread'],
      ['email', process.env.BUSINESS_EMAIL || 'contact@ssvastra.com'],
      ['phone', '9783770735'],
      ['whatsapp', 'https://wa.me/919783770735'],
      ['address', 'Green Vihar Vatika, Sanganer, Jaipur 303905'],
      ['free_shipping_threshold', '1999'],
      ['cod_enabled', 'true'],
      ['gateway_enabled', 'true'],
      ['payment_gateway_provider', 'razorpay'],
      ['data_mode', 'live'],
    ];

    for (const [key, value] of defaultSettings) {
      await client.query(
        `
        INSERT INTO settings (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
      `,
        [key, value]
      );
    }
    console.log('✅ Step 6 Complete: Store settings populated.');

    console.log('\n🎉 SUCCESS: All database tables created and data migrated to PostgreSQL successfully!');
  } catch (err) {
    console.error('❌ Error during PostgreSQL migration and seeding:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Execute if run directly via CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  runDatabaseMigrationsAndSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
