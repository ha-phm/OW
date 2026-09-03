import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'superadmin@openway.com';
  const plainPassword = 'SuperAdminPassword';

  console.log(`Đang tạo tài khoản superadmin cho email: ${adminEmail}...`);

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log('Tạo tài khoản Super Admin thành công!');
  console.log({
    id: superAdmin.id,
    email: superAdmin.email,
    role: superAdmin.role,
  });
}

main()
  .catch((e) => {
    console.error('Lỗi khi tạo Super Admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
