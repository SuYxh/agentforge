import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@tauri-apps/api': resolve(__dirname, './tests/__mocks__/@tauri-apps/api.ts'),
      '@tauri-apps/plugin-dialog': resolve(__dirname, './tests/__mocks__/@tauri-apps/plugin-dialog.ts'),
    },
  },
});
