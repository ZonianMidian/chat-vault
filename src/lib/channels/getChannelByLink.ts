import type { Platforms } from '$lib/types/common';

import { $format } from '$lib/utils';
import UrlPattern from 'url-pattern';

type PlatformConfig = {
	domains: string[];
	patterns: UrlPattern[];
};

type ChannelMatch = {
	platform: Platforms | 'kick';
	username: string;
};

const regexpOptions = {
	segmentValueCharset: 'a-zA-Z0-9._~@%-'
};

const systemRoutes: Record<Platforms | 'kick', Set<string>> = {
	twitch: new Set([
		'directory',
		'settings',
		'friends',
		'following',
		'subscriptions',
		'inventory',
		'wallet',
		'prime',
		'turbo',
		'drops',
		'jobs',
		'security',
		'downloads',
		'creatorcamp',
		'brand',
		'legal',
		'privacy',
		'community-guidelines',
		'p',
		'u'
	]),
	youtube: new Set([
		'watch',
		'playlist',
		'results',
		'feed',
		'trending',
		'subscriptions',
		'library',
		'history',
		'upload',
		'create',
		'studio',
		'analytics',
		'comments',
		'live',
		'gaming',
		'sports',
		'music',
		'news',
		'learning',
		'fashion',
		'account',
		'reporthistory',
		'pair',
		'tv',
		'attribution_link',
		'redirect',
		'supported_browsers',
		't',
		'embed',
		'iframe_api',
		'playlist_ajax',
		'get_video_info',
		'api'
	]),
	kick: new Set([
		'browse',
		'dashboard',
		'settings',
		'privacy',
		'terms',
		'guidelines',
		'support',
		'about',
		'jobs',
		'press',
		'api',
		'developers',
		'mobile',
		'download',
		'legal',
		'blog',
		'help',
		'contact',
		'categories'
	])
};

const channelConfigs: Record<Platforms | 'kick', PlatformConfig> = {
	twitch: {
		domains: ['twitch.tv'],
		patterns: [
			new UrlPattern('*/u/:username/*', regexpOptions),
			new UrlPattern('*/u/:username*', regexpOptions),
			new UrlPattern('*/:username/*', regexpOptions),
			new UrlPattern('*/:username*', regexpOptions)
		]
	},
	youtube: {
		domains: ['youtube.com', 'youtu.be'],
		patterns: [
			new UrlPattern('*/channel/:username*', regexpOptions),
			new UrlPattern('*/user/:username*', regexpOptions),
			new UrlPattern('*/c/:username*', regexpOptions),
			new UrlPattern('*/@:username*', regexpOptions),
			new UrlPattern('*/:username*', regexpOptions)
		]
	},
	kick: {
		domains: ['kick.com'],
		patterns: [
			new UrlPattern('*/:username/*', regexpOptions),
			new UrlPattern('*/:username*', regexpOptions)
		]
	}
};

function isValidUsername(username: string, platform: Platforms | 'kick'): boolean {
	if (!username || systemRoutes[platform].has(username.toLowerCase())) {
		return false;
	}

	switch (platform) {
		case 'youtube':
			if (username.startsWith('@')) {
				return /^@[a-zA-Z0-9_.-]{1,30}$/.test(username);
			}
			if (username.startsWith('UC') && username.length === 24) {
				return /^UC[a-zA-Z0-9_-]{22}$/.test(username);
			}
			return /^[a-zA-Z0-9_.-]{1,50}$/.test(username);
		case 'twitch':
			return /^[a-zA-Z0-9_]{1,25}$/.test(username);
		case 'kick':
			return /^[a-zA-Z0-9_-]{1,25}$/.test(username);
		default:
			return false;
	}
}

function extractChannelInfo(url: string): ChannelMatch | null {
	try {
		if (!/^[a-zA-Z]+:\/\//.test(url)) {
			url = `https://${url}`;
		}

		const parsedUrl = new URL(url);
		const hostname = parsedUrl.hostname.toLowerCase();

		for (const [platform, config] of Object.entries(channelConfigs)) {
			if (config.domains.some((domain) => hostname.includes(domain))) {
				for (const pattern of config.patterns) {
					const match = pattern.match(parsedUrl.pathname);

					if (
						match?.username &&
						isValidUsername(match.username, platform as Platforms | 'kick')
					) {
						return {
							platform: platform as Platforms | 'kick',
							username:
								platform === 'twitch' || platform === 'kick'
									? match.username.toLowerCase()
									: match.username
						};
					}
				}
			}
		}
	} catch (error) {
		console.error(`[${$format('channel.label')}] Parser:`, error);
	}

	return null;
}

export function getChannelByLink(urlString: string): string | null {
	const channelInfo = extractChannelInfo(urlString);
	return channelInfo ? `/channel/${channelInfo.platform}/${channelInfo.username}` : null;
}

export function getChannelInfo(urlString: string): ChannelMatch | null {
	return extractChannelInfo(urlString);
}
