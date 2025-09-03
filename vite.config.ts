import { defineConfig, createLogger, type LogOptions } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

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
	plugins: [tailwindcss(), sveltekit()],
	customLogger: logger,
	preview: {
		port: 4935,
		strictPort: false,
		allowedHosts: ['chatvau.lt']
	},
	server: {
		port: 4935,
		strictPort: false
	}
});
