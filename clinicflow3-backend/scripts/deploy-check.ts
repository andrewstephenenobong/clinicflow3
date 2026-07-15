import { spawnSync } from 'child_process';

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('Running Prisma generate...');
run('npx', ['prisma', 'generate', '--schema', 'prisma/schema.prisma']);
console.log('Running Prisma migrate deploy...');
run('npx', ['prisma', 'migrate', 'deploy', '--schema', 'prisma/schema.prisma']);
console.log('Deploy checks completed successfully.');
