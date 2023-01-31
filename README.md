<h1><picture>
  <source media="(prefers-color-scheme: dark)" srcset="./lib/assets/wordmark.dark.png?raw=true">
  <source media="(prefers-color-scheme: light)" srcset="./lib/assets/wordmark.light.png?raw=true">
  <img alt="Mastodon" src="./lib/assets/wordmark.light.png?raw=true" height="34">
</picture></h1>

[![GitHub release](https://img.shields.io/github/release/mastodon/mastodon.svg)][releases]
[![Build Status](https://img.shields.io/circleci/project/github/mastodon/mastodon.svg)][circleci]
[![Code Climate](https://img.shields.io/codeclimate/maintainability/mastodon/mastodon.svg)][code_climate]
[![Crowdin](https://d322cqt584bo4o.cloudfront.net/mastodon/localized.svg)][crowdin]
[![Docker Pulls](https://img.shields.io/docker/pulls/tootsuite/mastodon.svg)][docker]

[releases]: https://github.com/mastodon/mastodon/releases
[circleci]: https://circleci.com/gh/mastodon/mastodon
[code_climate]: https://codeclimate.com/github/mastodon/mastodon
[crowdin]: https://crowdin.com/project/mastodon
[docker]: https://hub.docker.com/r/tootsuite/mastodon/

Mastodon is a **free, open-source social network server** based on ActivityPub where users can Decentralized microblogs based on LikeCoin & Mastodon open source facilities, supporting likes for rewards, helping creators connect with their own communities and earn revenue from likes and subscriptions. On Mastodon, users can publish anything they want: links, pictures, text, video. All Mastodon servers are interoperable as a federated network (users on one server can seamlessly communicate with users from another one, including non-Mastodon software that implements ActivityPub)!

Click below to **learn more** in a video:

[![Screenshot](https://blog.joinmastodon.org/2018/06/why-activitypub-is-the-future/ezgif-2-60f1b00403.gif)][youtube_demo]

[youtube_demo]: https://www.youtube.com/watch?v=IPSbNdBmWKE

## Navigation

- [Project homepage 🐘](https://joinmastodon.org)
- [Support the development via Patreon][patreon]
- [View sponsors](https://joinmastodon.org/sponsors)
- [Blog](https://blog.joinmastodon.org)
- [Documentation](https://docs.joinmastodon.org)
- [Browse Mastodon servers](https://joinmastodon.org/communities)
- [Browse Mastodon apps](https://joinmastodon.org/apps)

[patreon]: https://www.patreon.com/mastodon

## Features

<img src="/app/javascript/images/elephant_ui_working.svg?raw=true" align="right" width="30%" />

### No vendor lock-in: Fully interoperable with any conforming platform

It doesn't have to be Mastodon; whatever implements ActivityPub is part of the social network! [Learn more](https://blog.joinmastodon.org/2018/06/why-activitypub-is-the-future/)

### Real-time, chronological timeline updates

Updates of people you're following appear in real-time in the UI via WebSockets. There's a firehose view as well!

### Media attachments like images and short videos

Upload and view images and WebM/MP4 videos attached to the updates. Videos with no audio track are treated like GIFs; normal videos loop continuously!

### Safety and moderation tools

Mastodon includes private posts, locked accounts, phrase filtering, muting, blocking and all sorts of other features, along with a reporting and moderation system. [Learn more](https://blog.joinmastodon.org/2018/07/cage-the-mastodon/)

### OAuth2 and a straightforward REST API

Mastodon acts as an OAuth2 provider, so 3rd party apps can use the REST and Streaming APIs. This results in a rich app ecosystem with a lot of choices!

## Deployment

### Tech stack:

- **Ruby on Rails** powers the REST API and other web pages
- **React.js** and Redux are used for the dynamic parts of the interface
- **Node.js** powers the streaming API

### Requirements:

- **PostgreSQL** 9.5+
- **Redis** 4+
- **Ruby** 2.7+
- **Node.js** 14+

The repository includes deployment configurations for **Docker and docker-compose** as well as specific platforms like **Heroku**, **Scalingo**, and **Nanobox**. For Helm charts, reference the [mastodon/chart repository](https://github.com/mastodon/chart). The [**standalone** installation guide](https://docs.joinmastodon.org/admin/install/) is available in the documentation.

A **Vagrant** configuration is included for development purposes. To use it, complete following steps:

- Install Vagrant and Virtualbox
- Install the `vagrant-hostsupdater` plugin: `vagrant plugin install vagrant-hostsupdater`
- Run `vagrant up`
- Run `vagrant ssh -c "cd /vagrant && foreman start"`
- Open `http://mastodon.local` in your browser

## Contributing

Mastodon is **free, open-source software** licensed under **AGPLv3**.

You can open issues for bugs you've found or features you think are missing. You can also submit pull requests to this repository or submit translations using Crowdin. To get started, take a look at [CONTRIBUTING.md](CONTRIBUTING.md). If your contributions are accepted into Mastodon, you can request to be paid through [our OpenCollective](https://opencollective.com/mastodon).

**IRC channel**: #mastodon on irc.libera.chat

## License

Copyright (C) 2016-2022 Eugen Rochko & other Mastodon contributors (see [AUTHORS.md](AUTHORS.md))

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.


Liker.Social 超級功能上新
1. 探索功能(重磅)
 a. 熱門分享
 b. 熱門標籤
 c. 最新新聞
 d. 推介用戶
2. 定時嘟文
   現在嘟文可以定時刪除了

如何支持 Liker.Social

本次更新，Mastodon 引入 1000+ 修改，經過幾天的代碼審查，Liker.Social 終於引入了一系列新功能。

如果你想繼續支持我們保持快速的更新運作，可以通過以下幾種方式：
1. 委託你的 LIKE 到 Liker.Social
2. 支持我們的 Patreon https://www.patreon.com/liker_social?fan_landing=true
3. 直接捐款：

ATOM
cosmos1ul4c57anu9q00vhr3lh8rjdrhqzx8g6cq2csx0

OSMO
osmo1ul4c57anu9q00vhr3lh8rjdrhqzx8g6cg3tqsa

LIKE
cosmos1ul4c57anu9q00vhr3lh8rjdrhqzx8g6cq2csx0

