import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-node';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const path = fileURLToPath(new URL('package.json', import.meta.url));
const pkg = JSON.parse(readFileSync(path, 'utf8'));

const config = {
	preprocess: vitePreprocess(),
	kit: { adapter: adapter(), version: { name: pkg.version } }
};

export default config;
