import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));

export default defineConfig({
    plugins: [react()],
    define: {
        __APP_VERSION__: JSON.stringify(version)
    },
    build: {
        outDir: 'build'
    },
    server: {
        port: 3000,
        proxy: {
            '/actions': 'http://localhost:8180'
        }
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
        css: false
    }
});
