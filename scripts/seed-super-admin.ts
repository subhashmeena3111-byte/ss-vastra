import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { db } from '../src/db/index.ts';
import { admins } from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';

dotenv.config();

async function runSuperAdminSeed() {
  const email = (process.env.SUPER_ADMIN_EMAIL || 'subhashmeena3111@gmail.com').toLowerCase().trim();
  const rawPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!rawPassword) {
    console.error(
      '❌ Error: SUPER_ADMIN_PASSWORD environment variable is not set.\n' +
      'Please set SUPER_ADMIN_PASSWORD in your .env file or environment before running this script.\n' +
      'Example: SUPER_ADMIN_PASSWORD="YourStrongPassword123" npm run seed:admin'
    );
    process.exit(1);
  }

  // Minimum 8 characters with letters and numbers
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(rawPassword)) {
    console.error(
      '❌ Error: SUPER_ADMIN_PASSWORD must be at least 8 characters long and contain both letters and numbers.'
    );
    process.exit(1);
  }

  console.log(`🔒 Seeding Super Admin account for: ${email}...`);

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    const existing = await db
      .select()
      .from(admins)
      .where(eq(admins.email, email));

    if (existing.length > 0) {
      await db
        .update(admins)
        .set({
          passwordHash,
          role: 'super_admin',
          isActive: true,
          mustChangePassword: true, // Forces owner to set a new password on first login
          failedAttempts: 0,
          lockedUntil: null,
        })
        .where(eq(admins.id, existing[0].id));

      console.log(`✅ Super Admin updated successfully: ${email}`);
    } else {
      await db.insert(admins).values({
        adminId: email,
        email,
        name: 'Subhash Meena (SS VASTRA Owner)',
        passwordHash,
        role: 'super_admin',
        isActive: true,
        mustChangePassword: true, // Forces owner to set a new password on first login
        failedAttempts: 0,
      });

      console.log(`✅ Super Admin created successfully: ${email}`);
    }

    console.log('✨ On first login, the owner will be prompted to set a new personal password.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed Super Admin:', err);
    process.exit(1);
  }
}

runSuperAdminSeed();
