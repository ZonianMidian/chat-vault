![ChatVault](https://github.com/user-attachments/assets/7cb4314d-b845-4b59-89f1-43e6a9479e4e)
Chat Vault by [Zonian](https://twitch.tv/ZonianMidian) [![Crowdin](https://badges.crowdin.net/chat-vault/localized.svg)](https://crowdin.com/project/chat-vault)
============

## What is this?

Explore channels and chat content such as badges and emotes on different streaming platforms.

## i18n

Help me translate Chat Vault into your language using [Crowdin](https://crowdin.com/project/chat-vault). If the language is not available, you can request it by creating an issue.

## Special Thanks

- [@Paauulli](https://paauulli.me): Donor of the domain for the website.
- [@treejadey](https://treejadey.com): Helped with the logo and design of the website.
- [@catamphetamine](https://gitlab.com/catamphetamine): For their repository of [country-flag-icons](https://gitlab.com/catamphetamine/country-flag-icons) used in this project.

## Issues/Suggestions

You can create a [GitHub Issue](https://github.com/ZonianMidian/chat-vault/issues)

## Installation

- `git clone https://github.com/ZonianMidian/chat-vault.git`
- `cd chat-vault`
- `pnpm install`
- `cp example_config.json config.json` and adjust it (see below)
- `pnpm start`

## Configuration

Settings and secrets live in `config.json`, which is not tracked by git. `example_config.json` documents every option:

| Option              | Description                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `server.port`       | Port the website listens on.                                                                |
| `redis.*`           | Connection to [Redis](https://redis.io), used to cache the responses of the upstream APIs.  |
| `cache.staleAfter`  | Seconds after which cached content is refreshed in the background while still being served. |
| `http.timeout`      | Milliseconds before a request to an upstream API is aborted.                                |
| `http.userAgent`    | `User-Agent` sent to the upstream APIs. Empty keeps the default one.                        |
| `youtube.apiKey`    | Optional key of the YouTube Data API v3, used when the keyless API fails.                   |
| `youtube.invidious` | Optional Invidious instance (domain or address) used as another fallback.                   |
| `youtube.cookie`    | Optional `Cookie` header of a signed-in youtube.com session (see below).                    |
| `log.level`         | `debug`, `info`, `warn` or `error`. `debug` also logs every upstream request.               |
| `log.slowRequest`   | Milliseconds after which an upstream request is reported as slow.                           |