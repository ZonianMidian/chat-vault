import { config } from './config';

const levels = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type Level = keyof typeof levels;

const threshold = levels[config.log.level] ?? levels.info;

function describe(detail: unknown): string {
	if (detail instanceof Error) {
		return detail.name === 'ProviderError' ? detail.message : (detail.stack ?? detail.message);
	}

	return typeof detail === 'string' ? detail : JSON.stringify(detail);
}

function write(level: Level, scope: string, message: string, detail?: unknown): void {
	if (levels[level] < threshold) return;

	const time = new Date().toISOString();
	const suffix = detail === undefined ? '' : ` — ${describe(detail)}`;

	console[level](`${time} ${level.toUpperCase().padEnd(5)} [${scope}] ${message}${suffix}`);
}

export const log = {
	debug: (scope: string, message: string, detail?: unknown) =>
		write('debug', scope, message, detail),
	info: (scope: string, message: string, detail?: unknown) =>
		write('info', scope, message, detail),
	warn: (scope: string, message: string, detail?: unknown) =>
		write('warn', scope, message, detail),
	error: (scope: string, message: string, detail?: unknown) =>
		write('error', scope, message, detail)
};
