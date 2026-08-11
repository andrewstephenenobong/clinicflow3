import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';

const [email, password] = process.argv.slice(2);
if (!email || !password) {
    console.error('Usage: npx tsx scripts/createUser.ts <email> <password>');
    process.exit(1);
}

async function main() {
    const clinic = await prisma.clinic.create({
        data: {
            name: 'User Seed Clinic',
            email,
            phone: '',
            address: '',
        },
    });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
        data: {
            clinicId: clinic.id,
            name: 'Seeded User',
            email: email.toLowerCase(),
            passwordHash,
            role: 'ADMIN',
        },
    });

    console.log('Created user:', {
        id: user.id,
        email: user.email,
        clinicId: clinic.id,
        role: user.role,
    });
}

main()
    .catch((e) => {
        console.error('Error creating user:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
