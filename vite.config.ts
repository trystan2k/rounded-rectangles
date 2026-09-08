import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Playwright owns the e2e/ folder; Vitest runs the unit tests in src/ only.
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
});
