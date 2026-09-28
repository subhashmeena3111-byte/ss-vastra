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
    if (existingProducts.length === 0) {
      const initialProducts = [
        {
          slug: 'red-embroidered-cotton-blend-kurta-set',
          name: 'Red Embroidered Cotton Blend Kurta Set',
          category: 'Kurta Sets',
          price: 1899,
          originalPrice: 2699,
          discountPercent: 30,
          sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']),
          stock: 45,
          image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',
          description: 'A graceful, comfortable crimson red kurta set featuring intricate neck embroidery, flattering flared fit, and matching cigarette pants with dupatta.',
          fabric: 'Premium Cotton Blend',
          color: 'Crimson Red',
          highlights: JSON.stringify(['Stylish V-Neck', 'Beautiful Embroidery', 'Flair Fit', 'Premium Cotton Blend', 'Soft & Comfortable']),
          isNewArrival: true,
          isBestSeller: true,
          isFeatured: true,
          extraImages: [
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',
          ],
        },
        {
          slug: 'bloom-in-grace-fuchsia-pink-anarkali-set',
          name: 'Bloom in Grace Fuchsia Pink Anarkali Set',
          category: 'Anarkali & Dresses',
          price: 2499,
          originalPrice: 3499,
          discountPercent: 28,
          sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
          stock: 35,
          image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=80',
          description: 'Exquisite 3-piece flared Anarkali suit set with hand-embroidered yoke, flowing tiered flare, and lightweight chiffon dupatta with delicate gotapatti lace.',
          fabric: 'Pure Muslin Cotton',
          color: 'Fuchsia Pink',
          highlights: JSON.stringify(['Handmade Tassels', 'Flared Ghera', 'Breathable Muslin', 'Festive Ready']),
          isNewArrival: true,
          isBestSeller: true,
          isFeatured: false,
          extraImages: [
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80',
          ],
        },
        {
          slug: 'fresh-floral-sky-blue-co-ord-set',
          name: 'Fresh Floral Sky Blue Co-ord Set',
          category: 'Co-ord Sets',
          price: 1599,
          originalPrice: 2299,
          discountPercent: 30,
          sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
          stock: 28,
          image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=900&q=80',
          description: 'Chic modern ethnic co-ord set with collared button-down tunic and relaxed straight-fit trousers. Perfect for office wear or casual outings.',
          fabric: 'Soft Rayon Slub',
          color: 'Sky Blue Floral',
          highlights: JSON.stringify(['Comfort Waistband', 'Pockets Included', 'Pre-shrunk Fabric', 'Zero Color Bleed']),
          isNewArrival: true,
          isBestSeller: false,
          isFeatured: false,
          extraImages: [],
        },
        {
          slug: 'grace-in-every-thread-pastel-peach-suit',
          name: 'Grace in Every Thread Pastel Peach Suit',
          category: 'Kurta Sets',
          price: 2199,
          originalPrice: 2999,
          discountPercent: 27,
          sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL', '3XL']),
          stock: 40,
          image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80',
          description: 'Subtle and soothing pastel peach kurta set with sequin threadwork along the neckline, paired with scalloped organza dupatta.',
          fabric: 'Chanderi Silk Blend',
          color: 'Pastel Peach',
          highlights: JSON.stringify(['Organza Scalloped Dupatta', 'Subtle Shimmer Work', 'Inner Lining Attached']),
          isNewArrival: false,
          isBestSeller: true,
          isFeatured: false,
          extraImages: [],
        },
        {
          slug: 'royal-teal-mirror-work-kurti-palazzo',
          name: 'Royal Teal Mirror-Work Kurti & Palazzo',
          category: 'Kurta / Kurtis',
          price: 1399,
          originalPrice: 1899,
          discountPercent: 26,
          sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
          stock: 52,
          image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80',
          description: 'Striking peacock teal short kurti with authentic Rajasthani mirror and gotapatti detailing, paired with wide-leg palazzo pants.',
          fabric: '100% Sanganeri Cotton',
          color: 'Teal Blue',
          highlights: JSON.stringify(['Authentic Mirror Work', 'Wide-Leg Flared Palazzo', 'Jaipur Handcrafted']),
          isNewArrival: false,
          isBestSeller: true,
          isFeatured: false,
          extraImages: [],
        },
        {
          slug: 'mehendi-olive-embroidered-festive-suit',
          name: 'Mehendi Olive Embroidered Festive Suit',
          category: 'Festive Fits',
          price: 2799,
          originalPrice: 3899,
          discountPercent: 28,
          sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
          stock: 22,
          image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=900&q=80',
          description: 'Lustrous olive green ethnic suit enriched with gold zari embroidery and cut-work border on sleeves and organza dupatta.',
          fabric: 'Silk Chanderi',
          color: 'Olive Green',
          highlights: JSON.stringify(['Zari Cut-Work', 'Heavy Festive Border', 'Comfortable Fit']),
          isNewArrival: true,
          isBestSeller: true,
          isFeatured: false,
          extraImages: [],
        },
        {
          slug: 'authentic-sanganeri-handblock-cotton-fabric',
          name: 'Authentic Sanganeri Handblock Cotton Fabric (Per Meter)',
          category: 'Fabrics',
          price: 349,
          originalPrice: 499,
          discountPercent: 30,
          sizes: JSON.stringify(['1 Meter', '2.5 Meter', '5 Meter', '10 Meter Bundle']),
          stock: 200,
          image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=900&q=80',
          description: 'Traditional wooden handblock printed fabric created by master artisans in Sanganer, Jaipur. Natural dyes, soft 60x60 cambric cotton.',
          fabric: '100% Pure Cambric Cotton (60s)',
          color: 'Indigo & Madder Red',
          highlights: JSON.stringify(['Natural Dye Colors', 'Direct from Sanganer Looms', 'Ultra Soft & Durable']),
          isNewArrival: false,
          isBestSeller: true,
          isFeatured: false,
          extraImages: [],
        },
        {
          slug: 'ivory-floral-jaipuri-print-anarkali-dress',
          name: 'Ivory Floral Jaipuri Print Anarkali Dress',
          category: 'Anarkali & Dresses',
          price: 2199,
          originalPrice: 2999,
          discountPercent: 26,
          sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
          stock: 30,
          image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=900&q=80',
          description: 'Breezy ivory white floor-length Anarkali with subtle pastel floral boota prints, tie-up dori with pom-poms, and contrast border.',
          fabric: 'Mulmul Cotton',
          color: 'Ivory White',
          highlights: JSON.stringify(['Full Floor Length', 'Lightweight Mulmul', 'Handmade Dori Tassels']),
          isNewArrival: true,
          isBestSeller: false,
          isFeatured: false,
          extraImages: [],
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
          imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=85',
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
