import { hash } from 'bcryptjs';
import { z } from 'zod';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { PlatformAdminModel } from '../modules/platform/platform-admin.model.js';

const inputSchema = z.object({
  SUPERADMIN_NAME: z.string().trim().min(2),
  SUPERADMIN_EMAIL: z.email().transform((value) => value.toLowerCase()),
  SUPERADMIN_PASSWORD: z.string().min(12).regex(/[A-Z]/).regex(/[a-z]/).regex(/\d/),
});

const run = async (): Promise<void> => {
  const input = inputSchema.parse(process.env);
  await connectDatabase();
  const passwordHash = await hash(input.SUPERADMIN_PASSWORD, 12);
  const existing = await PlatformAdminModel.findOne({ email: input.SUPERADMIN_EMAIL });
  if (existing) {
    existing.name = input.SUPERADMIN_NAME;
    existing.passwordHash = passwordHash;
    existing.isActive = true;
    await existing.save();
    console.log('Platform superadmin updated');
  } else {
    await PlatformAdminModel.create({ name: input.SUPERADMIN_NAME, email: input.SUPERADMIN_EMAIL, passwordHash });
    console.log('Platform superadmin created');
  }
  await disconnectDatabase();
};

void run().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Failed to seed platform superadmin');
  await disconnectDatabase();
  process.exit(1);
});
