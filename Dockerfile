# @license AGPL-3.0-or-later
#
# Copyright(C) 2025 Hong Xu <hong@topbug.net>
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

# snapshot versions, either prod or test
ARG snapshot_versions_type=prod

# Use alpine instead of busybox here, because busybox's wget can't verify TLS
# certificate.
FROM docker.io/alpine:3.21.0@sha256:2c43f33bd1502ec7818bce9eea60e062d04eeadc4aa31cad9dabecb1e48b647b as snapshot-versions-getter-base

# Production snapshot versions
FROM snapshot-versions-getter-base as snapshot-versions-getter-prod

RUN apk add wget

RUN wget --check-certificate https://delpa.org/snapshot_versions.json && \
    wget --check-certificate https://delpa.org/snapshot_versions.json.sha256

# Verify that snapshot_versions.json is in the sha256 checksum file and verify
# checksum
RUN grep snapshot_versions.json snapshot_versions.json.sha256 && \
    sha256sum -c snapshot_versions.json.sha256

# Test snapshot versions
FROM snapshot-versions-getter-base as snapshot-versions-getter-test

COPY ./snapshot_versions.json .

FROM snapshot-versions-getter-${snapshot_versions_type} as snapshot-versions-getter


FROM docker.io/node:22.12.0-alpine@sha256:6e80991f69cc7722c561e5d14d5e72ab47c0d6b6cfb3ae50fb9cf9a7b30fdf97 as caddyfile-builder

COPY package.json package-lock.json ./
RUN npm install -g npm && npm install
COPY . .
COPY --from=snapshot-versions-getter ./snapshot_versions.json .
RUN npx tsx gen_caddy.ts > Caddyfile

FROM docker.io/caddy:2.8.4-alpine@sha256:e97e0e3f8f51be708a9d5fadbbd75e3398c22fc0eecd4b26d48561e3f7daa9eb

LABEL org.opencontainers.image.authors="Hong Xu <hong@topbug.net>"
LABEL org.opencontainers.image.title="Delpa Redirection Server"
LABEL org.opencontainers.image.source="https://github.com/delpa-org/redirection-server"
LABEL org.opencontainers.image.licenses=AGPL-3.0-or-later
LABEL org.opencontainers.image.url="https://delpa.org"

COPY --from=caddyfile-builder Caddyfile /etc/caddy/
