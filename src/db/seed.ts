import bcrypt from 'bcryptjs';
import { db } from './index.ts';
import {
  admins,
  roles,
  categories,
  products,
  productImages,
  settings,
  coupons,
  banners,
} from './schema.ts';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  try {
    // 1. Check or Seed Roles
    const existingRoles = await db.select().from(roles);
    if (existingRoles.length === 0) {
      await db.insert(roles).values([
        {
          name: 'super_admin',
          permissions: JSON.stringify([
            'all',
            'orders_manage',
            'products_manage',
            'catalog_images_manage',
            'customers_view',
            'coupons_manage',
            'staff_manage',
            'payments_manage',
            'reports_view',
            'settings_manage',
            'activity_log_view',
          ]),
        },
        {
          name: 'staff',
          permissions: JSON.stringify([
            'orders_manage',
            'products_manage',
            'catalog_images_manage',
          ]),
        },
      ]);
      console.log('Seeded roles.');
    }

    // 2. Check or Seed Super Admin
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'subhashmeena3111@gmail.com').toLowerCase().trim();
    const superAdminPass = (process.env.SUPER_ADMIN_PASSWORD && process.env.SUPER_ADMIN_PASSWORD !== 'your-strong-super-admin-password' && process.env.SUPER_ADMIN_PASSWORD !== '1000')
      ? process.env.SUPER_ADMIN_PASSWORD
      : 'Meena9829@';

    // Check if super admin already exists by email or default adminId
    const existingAdmins = await db.select().from(admins);
    const existingAdmin = existingAdmins.find(
      (a) => a.email === superAdminEmail || a.adminId === superAdminEmail || a.adminId === 'admin' || a.id === 1
    );

    if (existingAdmin) {
      // Ensure email and role are up to date
      const updateData: Record<string, unknown> = {
        email: superAdminEmail,
        role: 'super_admin',
        isActive: true,
        mustChangePassword: false,
      };

      // If SUPER_ADMIN_PASSWORD is provided in environment or default, update the password hash
      if (superAdminPass) {
        const salt = await bcrypt.genSalt(10);
        updateData.passwordHash = await bcrypt.hash(superAdminPass, salt);
      }

      await db
        .update(admins)
        .set(updateData)
        .where(eq(admins.id, existingAdmin.id));
      console.log(`Synchronized super admin account: ${superAdminEmail}`);
    } else {
      // Create new super admin with password from env (or secure random token if env not yet set)
      const salt = await bcrypt.genSalt(10);
      const initialPass = superAdminPass || (await import('crypto')).randomBytes(24).toString('base64');
      const passwordHash = await bcrypt.hash(initialPass, salt);

      await db.insert(admins).values({
        adminId: superAdminEmail,
        email: superAdminEmail,
        passwordHash,
        name: 'Subhash Meena (SS VASTRA Owner)',
        role: 'super_admin',
        mustChangePassword: true, // Forces change on first login as per spec
        failedAttempts: 0,
        isActive: true,
      });
      console.log(`Seeded super admin: ${superAdminEmail}`);
    }

    // 3. Check or Seed Categories
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length === 0) {
      await db.insert(categories).values([
        {
          slug: 'kurta-sets',
          name: 'Kurta Sets',
          icon: '👗',
          image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
          description: 'Graceful embroidered and printed ethnic kurta sets with bottoms & dupattas.',
          displayOrder: 1,
        },
        {
          slug: 'co-ord-sets',
          name: 'Co-ord Sets',
          icon: '👚',
          image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=600&q=80',
          description: 'Contemporary matching sets designed for festive flair and everyday chic.',
          displayOrder: 2,
        },
        {
          slug: 'anarkali-dresses',
          name: 'Anarkali & Dresses',
          icon: '💃',
          image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
          description: 'Flowing flares, fine muslin cotton and gotapatti lace royal dresses.',
          displayOrder: 3,
        },
        {
          slug: 'kurta-kurtis',
          name: 'Kurta / Kurtis',
          icon: '🌸',
          image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
          description: 'Breathable Jaipur cotton tunics, short kurtas and daily office staples.',
          displayOrder: 4,
        },
        {
          slug: 'festive-fits',
          name: 'Festive Fits',
          icon: '👑',
          image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=600&q=80',
          description: 'Rich Chanderi, zari borders and celebratory suits for auspicious occasions.',
          displayOrder: 5,
        },
        {
          slug: 'fabrics',
          name: 'Fabrics',
          icon: '🧵',
          image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=600&q=80',
          description: 'Direct from Sanganer master wooden handblock cambric & mulmul cotton.',
          displayOrder: 6,
        },
        {
          slug: 'new-arrivals',
          name: 'New Arrivals',
          icon: '🌟',
          image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80',
          description: 'Freshly loomed designs and latest seasonal silhouettes.',
          displayOrder: 7,
        },
        {
          slug: 'best-sellers',
          name: 'Best Sellers',
          icon: '🔥',
          image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
          description: 'Most loved Jaipur creations ordered across India.',
          displayOrder: 8,
        },
      ]);
      console.log('Seeded categories.');
    }

    // 4. Check or Seed Products
    const existingProducts = await db.select().from(products);
    if (existingProducts.length === 0 && process.env.SEED_DEMO_PRODUCTS === 'true') {
      const initialProducts = [
        {
          slug: 'olive-green-embroidered-3-piece-suit-set-977',
          name: 'Olive Green Embroidered 3-Piece Suit Set',
          category: 'Kurta Sets',
          price: 999,
          originalPrice: 1999,
          discountPercent: 50,
          sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL', '3XL']),
          stock: 100,
          image: '/api/uploads/1790776717697_DE5C3FC2-E25A-42B5-B4C2-E0AD1E1CBC1B_png.jpg',
          description: 'Royal olive green elegance with delicate embroidery and a graceful dupatta — a timeless ethnic look by SS VASTRA. ✨',
          fabric: 'Premium Rayon Blend',
          color: 'Olive Green with Gold Embroidery',
          highlights: JSON.stringify(['Delicate Gold Embroidery', '3-Piece Festive Set', 'Straight Fit Pants', 'Fast Dispatch']),
          isNewArrival: true,
          isBestSeller: true,
          isFeatured: true,
          extraImages: [
            '/api/uploads/1790776723859_8DC8AAD9-C440-4549-8011-29EB8CCC21FB_png.jpg',
            '/api/uploads/1790776729293_8AFA4156-3FBD-4126-B3C1-6A47F098A566_png.jpg',
            '/api/uploads/1790776733479_55D07E03-4236-427E-B8E9-15B97B6C2784_png.jpg',
          ],
        },
        {
          slug: 'red-floral-embroidered-kurta-pant-set-with-dupatta-519',
          name: 'Red Floral Embroidered Kurta Pant Set with Dupatta',
          category: 'Kurta Sets',
          price: 999,
          originalPrice: 2999,
          discountPercent: 67,
          sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
          stock: 99,
          image: '/api/uploads/1790762637327_E98EF014-C501-4A97-9A45-B237E0283D81_png.jpg',
          description: 'Red Floral Embroidered 3-Piece Suit Set — SS VASTRA',
          fabric: 'Premium Cotton Blend',
          color: 'Red / Rani Red',
          highlights: JSON.stringify(['Multicolor Floral Embroidery', 'Graceful V-Neckline', 'Matching Embroidered Dupatta', 'Pure Fabric']),
          isNewArrival: true,
          isBestSeller: true,
          isFeatured: true,
          extraImages: [
            '/api/uploads/1790762718131_D3312AF4-E11D-477D-BBB1-2D30ED4DA54F_png.jpg',
            '/api/uploads/1790762861999_FF04CE96-FD79-441F-854D-38A5CC34F507_png.jpg',
            '/api/uploads/1790762912677_D30D4ECA-C5C6-4140-8739-E869A56D8998_png.jpg',
          ],
        },
        {
          slug: 'peach-embroidered-kurta-pant-dupatta-suit-set--576',
          name: 'Peach Embroidered Kurta Pant & Dupatta Suit Set',
          category: 'Kurta Sets',
          price: 999,
          originalPrice: 1999,
          discountPercent: 50,
          sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
          stock: 100,
          image: '/api/uploads/1790761962059_05E9E31B-E53C-49FE-8C19-6DF3DCAD364A_png.jpg',
          description: 'Peach Embroidered 3-Piece Suit Set — SS VASTRA',
          fabric: 'Pure Cotton mulmul',
          color: 'Pastel Peach',
          highlights: JSON.stringify(['Pure Cotton Mulmul', 'Intricate Neckline Embroidery', 'Matching Straight Pant', 'Graceful Dupatta']),
          isNewArrival: true,
          isBestSeller: false,
          isFeatured: true,
          extraImages: [
            '/api/uploads/1790761966940_378BC2B9-74A1-481B-8DBA-2C9B757F555E_png.jpg',
            '/api/uploads/1790762053453_7EC6C937-1F78-4CAE-AC3B-DAEE68AF3089_png.jpg',
            '/api/uploads/1790762302488_04575528-EFAC-4A84-86D5-395FA9BB0E4F_png.jpg',
          ],
        },
        {
          slug: 'teal-embroidered-kurta-pant-dupatta-suit-set-858',
          name: 'Teal Embroidered Kurta Pant & Dupatta Suit Set',
          category: 'Kurta Sets',
          price: 999,
          originalPrice: 1999,
          discountPercent: 50,
          sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
          stock: 100,
          image: '/api/uploads/1790760655275_80B18A6F-C029-42ED-944E-34C09330C972_png.jpg',
          description: 'Teal Embroidered Kurta Pant & Dupatta Suit Set — SS VASTRA',
          fabric: 'Premium ethnic-wear fabric',
          color: 'Teal Blue',
          highlights: JSON.stringify(['Elegant Teal Shade', 'Embroidered Neckline', 'Comfortable 3-Piece Set', 'Matching Dupatta']),
          isNewArrival: true,
          isBestSeller: false,
          isFeatured: true,
          extraImages: [
            '/api/uploads/1790760665186_6CC7A0C9-AFC3-406E-BC5C-C3685AAD695E_png.jpg',
            '/api/uploads/1790760677776_D79CCCF4-D910-4CC2-A681-6E049FF13062_png.jpg',
            '/api/uploads/1790760691141_8E1B95CF-C2F6-40CE-83DD-08D7307216BC_png.jpg',
          ],
        },
      ];

      for (const p of initialProducts) {
        const { extraImages, ...productFields } = p;
        const inserted = await db.insert(products).values(productFields).returning();
        const prodId = inserted[0].id;

        // Insert main image
        await db.insert(productImages).values({
          productId: prodId,
          imageUrl: p.image,
          displayOrder: 0,
          isMain: true,
        });

        // Insert extra gallery images
        for (let i = 0; i < extraImages.length; i++) {
          await db.insert(productImages).values({
            productId: prodId,
            imageUrl: extraImages[i],
            displayOrder: i + 1,
            isMain: false,
          });
        }
      }
      console.log('Seeded products.');
    }

    // 5. Check or Seed Settings
    const defaultStoreSettings = [
      { key: 'store_name', value: 'SS VASTRA', description: 'Store Brand Name' },
      { key: 'tagline', value: 'Elegance in Every Thread', description: 'Store Tagline' },
      { key: 'category', value: 'Ladies Fashion & Fabrics', description: 'Category' },
      { key: 'address', value: 'Green Vihar Vatika, Sanganer, Jaipur 303905', description: 'Store Physical Address' },
      { key: 'phone', value: '9783770735', description: 'Support Phone Number' },
      { key: 'whatsapp', value: 'https://wa.me/919783770735', description: 'WhatsApp Order Link' },
      { key: 'email', value: 'subhashmeena3111@gmail.com', description: 'Official Email' },
      { key: 'instagram', value: 'https://instagram.com/SS_vastra', description: 'Instagram Profile' },
      { key: 'cod_enabled', value: 'true', description: 'Enable Cash on Delivery' },
      { key: 'shipping_fee', value: '0', description: 'Default shipping fee in INR' },
      { key: 'free_shipping_threshold', value: '1999', description: 'Order value above which shipping is free' },
      { key: 'razorpay_key_id', value: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key', description: 'Razorpay Public Key' },
      { key: 'payment_gateway_provider', value: 'razorpay', description: 'Primary online payment gateway' },
      { key: 'payment_gateway_mode', value: 'test', description: 'Gateway mode test or live' },
      { key: 'gateway_enabled', value: 'true', description: 'Enable online gateway payments' },
      { key: 'bank_transfer_enabled', value: 'true', description: 'Enable direct bank transfer NEFT/IMPS' },
      { key: 'bank_name', value: 'State Bank of India (SBI)', description: 'Bank Name' },
      { key: 'bank_account_holder', value: 'SS VASTRA - SUBHASH MEENA', description: 'Account Holder Name' },
      { key: 'bank_account_number', value: '38920100054231', description: 'Bank Account Number' },
      { key: 'bank_ifsc', value: 'SBIN0031114', description: 'Bank IFSC Code' },
      { key: 'bank_branch', value: 'Sanganer Branch, Jaipur', description: 'Bank Branch Name' },
      { key: 'bank_account_type', value: 'Current Account', description: 'Account Type' },
      { key: 'bank_instructions', value: 'Kripya payment transfer ke baad transaction UTR reference number aur screenshot WhatsApp helpline par bhejein.', description: 'Instructions for Bank Transfer' },
      { key: 'upi_enabled', value: 'true', description: 'Enable Direct UPI payment' },
      { key: 'upi_id', value: '9783770735@upi', description: 'Primary UPI ID' },
      { key: 'upi_secondary_id', value: 'ssvastra@okaxis', description: 'Secondary UPI ID' },
      { key: 'upi_name', value: 'SS VASTRA JAIPUR', description: 'Merchant / Business Name on UPI' },
      { key: 'upi_number', value: '9783770735', description: 'Mobile number linked to UPI' },
      { key: 'upi_qr_image', value: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3D9783770735%40upi%26pn%3DSS%2520VASTRA%2520JAIPUR%26cu%3DINR', description: 'UPI QR code image' },
      {
        key: 'delivery_partners',
        value: JSON.stringify([
          {
            id: 'delhivery',
            name: 'Delhivery Express',
            trackingUrlTemplate: 'https://www.delhivery.com/track/package/{TRACKING_NO}',
            estimatedDays: '2 to 4 Business Days',
            phone: '1800 102 4567',
            isDefault: true,
            isActive: true,
          },
          {
            id: 'shiprocket',
            name: 'Shiprocket Direct',
            trackingUrlTemplate: 'https://shiprocket.co/tracking/{TRACKING_NO}',
            estimatedDays: '3 to 5 Business Days',
            phone: '011 4056 1234',
            isDefault: false,
            isActive: true,
          },
          {
            id: 'bluedart',
            name: 'Blue Dart Express',
            trackingUrlTemplate: 'https://www.bluedart.com/tracking?numbers={TRACKING_NO}',
            estimatedDays: '1 to 3 Business Days',
            phone: '1860 233 1234',
            isDefault: false,
            isActive: true,
          },
          {
            id: 'dtdc',
            name: 'DTDC Courier',
            trackingUrlTemplate: 'https://www.dtdc.in/tracking/shipment-tracking.asp?trkType=AWB&strCnno={TRACKING_NO}',
            estimatedDays: '3 to 5 Business Days',
            phone: '080 2536 5032',
            isDefault: false,
            isActive: true,
          },
          {
            id: 'indiapost',
            name: 'India Post Speed Post',
            trackingUrlTemplate: 'https://www.indiapost.gov.in/_layouts/15/dpt.cpt.infrastructure/pages/trackconsignment.aspx?consignment={TRACKING_NO}',
            estimatedDays: '4 to 7 Business Days',
            phone: '1800 266 6868',
            isDefault: false,
            isActive: true,
          },
        ]),
        description: 'Configured Delivery and Courier Partners List',
      },
    ];

    for (const item of defaultStoreSettings) {
      await db
        .insert(settings)
        .values(item)
        .onConflictDoNothing({ target: settings.key });
    }
    console.log('Ensured default settings.');

    // 6. Check or Seed Coupons
    const existingCoupons = await db.select().from(coupons);
    if (existingCoupons.length === 0) {
      await db.insert(coupons).values([
        { code: 'WELCOME10', discountType: 'percent', discountValue: 10, minOrderAmount: 999, maxDiscount: 500, isActive: true },
        { code: 'JAIPUR100', discountType: 'flat', discountValue: 100, minOrderAmount: 1499, isActive: true },
        { code: 'FESTIVE15', discountType: 'percent', discountValue: 15, minOrderAmount: 2499, maxDiscount: 800, isActive: true },
      ]);
      console.log('Seeded coupons.');
    }

    // 7. Check or Seed Banners
    const existingBanners = await db.select().from(banners);
    if (existingBanners.length === 0) {
      await db.insert(banners).values([
        {
          title: 'Elegance in Every Thread',
          subtitle: 'Ladies Fashion & Fabrics',
          imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1600&q=85',
          ctaText: 'Explore Collections',
          ctaLink: '#products-section',
          isActive: true,
          displayOrder: 1,
        },
      ]);
      console.log('Seeded banners.');
    }

    console.log('Database initialization & seeding completed successfully.');
  } catch (err) {
    console.warn('Database seed note (local storage active if SQL is unreachable):', (err as Error)?.message || err);
  }
}
