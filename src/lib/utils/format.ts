export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getElapsed(time: Date | string | null): string {
	if (!time) return '0:00:00';

	const diffSec = Math.max(0, Math.floor((Date.now() - new Date(time).getTime()) / 1000));

	const hours = Math.floor(diffSec / 3600);
	const minutes = Math.floor((diffSec % 3600) / 60);
	const seconds = diffSec % 60;

	return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

export function getSubscriptionTier(version: number): 1 | 2 | 3 {
	return version >= 3000 ? 3 : version >= 2000 ? 2 : 1;
}
