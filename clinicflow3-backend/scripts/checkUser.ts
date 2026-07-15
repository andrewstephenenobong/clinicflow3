import { prisma } from '../src/lib/prisma';

const email = process.argv[2];
if (!email) {
    console.error('Usage: npx tsx scripts/checkUser.ts <email>');
    process.exit(1);
}

async function main() {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { clinic: true },
    });
    console.log(JSON.stringify(user, null, 2));
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
