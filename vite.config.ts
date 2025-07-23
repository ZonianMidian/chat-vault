import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	preview: {
		port: 4935,
		strictPort: false
	},
	server: {
		port: 4935,
		strictPort: false
	}
});
