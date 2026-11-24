import { User } from '../models/User.js';
import { Role } from '../constants/roles.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export async function seedDatabase() {
  try {
    const existingAdmin = await User.findOne({ email: config.seed.adminEmail });

    if (!existingAdmin) {
      logger.info(`Seeding initial super-admin: ${config.seed.adminEmail}`);
      const admin = new User({
        name: config.seed.adminName,
        email: config.seed.adminEmail,
        password: config.seed.adminPassword,
        role: Role.SUPER_ADMIN,
        isActive: true,
      });

      await admin.save();
      logger.info(`✅ Initial Super Admin created successfully [${config.seed.adminEmail}]`);
    } else {
      const isMatch = await existingAdmin.comparePassword(config.seed.adminPassword);
      if (!isMatch) {
        existingAdmin.password = config.seed.adminPassword;
        existingAdmin.isActive = true;
        await existingAdmin.save();
        logger.info(`🔑 Reset password for existing admin: [${config.seed.adminEmail}]`);
      } else {
        logger.info(`Admin user [${config.seed.adminEmail}] already exists with matching credentials.`);
      }
    }
  } catch (err: any) {
    logger.error(`Seed error: ${err.message}`);
  }
}

// Allow standalone CLI invocation: npm run seed
if (process.argv[1]?.includes('seed.ts') || process.argv[1]?.includes('seed.js')) {
  import('../config/database.js').then(async ({ connectDB }) => {
    await connectDB();
    await seedDatabase();
    process.exit(0);
  });
}
