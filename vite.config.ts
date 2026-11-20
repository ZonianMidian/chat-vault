import { defineConfig, createLogger, type LogOptions } from 'vite';
import { existsSync, readFileSync } from 'node:fs';
import { sveltekit } from '@sveltejs/kit/vite';
import { execSync } from 'node:child_process';
import adapter from '@sveltejs/adapter-node';
import tailwindcss from '@tailwindcss/vite';

const configPath = process.env.CHAT_VAULT_CONFIG ?? 'config.json';
const port: number =
	(existsSync(configPath) && JSON.parse(readFileSync(configPath, 'utf8')).server?.port) || 4935;

const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };

function currentCommit(): string | null {
	try {
		return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
			.toString()
			.trim();
	} catch {
		return null;
	}
}

const logger = createLogger();
const originalWarn = logger.warn.bind(logger);
(logger as { warn: (msg: string, options?: LogOptions) => void }).warn = (
	msg: string,
	options?: LogOptions
) => {
	if (
		typeof msg === 'string' &&
		msg.includes('Assets in the public directory are served at the root path')
	) {
		return;
	}
	originalWarn(msg, options);
};

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			adapter: adapter()
		})
	],
	define: {
		__VERSION__: JSON.stringify(version),
		__COMMIT__: JSON.stringify(currentCommit())
	},
	customLogger: logger,
	preview: {
		port,
		strictPort: false,
		allowedHosts: ['chatvau.lt']
	},
	server: {
		port,
		strictPort: false
	}
});
