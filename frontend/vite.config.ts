import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// 개발 중에는 백엔드(scripts/bootrun-dev.sh, 127.0.0.1:8080)로 API 를 프록시한다.
// 배포 시에는 NPM 이 같은 도메인에서 /api → api 컨테이너로 보내므로 동일 출처가 유지된다.
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://127.0.0.1:8080';

export default defineConfig({
	plugins: [
		// router 플러그인은 react 플러그인보다 먼저 와야 한다
		tanstackRouter({ target: 'react', autoCodeSplitting: true }),
		react(),
		// React 18 대상 컴파일 — 런타임은 react-compiler-runtime 이 제공한다
		babel({ presets: [reactCompilerPreset({ target: '18' })] }),
		tailwindcss(),
	],
	resolve: {
		alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
	},
	server: {
		host: '127.0.0.1',
		port: 5173,
		proxy: {
			'/api': { target: BACKEND_URL, changeOrigin: false },
		},
	},
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test/setup.ts'],
	},
});
