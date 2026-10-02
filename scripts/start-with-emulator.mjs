/**
 * Expo'yu emülatör modunda başlatır (EXPO_PUBLIC_USE_EMULATOR=true).
 * Ek argümanlar Expo'ya aktarılır, örn: npm run start:emulator -- --web
 */
import { spawn } from 'node:child_process';

const child = spawn('npx', ['expo', 'start', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, EXPO_PUBLIC_USE_EMULATOR: 'true' },
});

child.on('exit', (code) => process.exit(code ?? 0));
