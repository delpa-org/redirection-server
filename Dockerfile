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
FROM docker.io/alpine:3.24.1@sha256:28bd5fe8b56d1bd048e5babf5b10710ebe0bae67db86916198a6eec434943f8b as snapshot-versions-getter-base

# Remove the community repository. This is to ensure that we only rely on
# packages with future availability.
RUN sed -i /community/d /etc/apk/repositories && cat /etc/apk/repositories

# Production snapshot versions
FROM snapshot-versions-getter-base as snapshot-versions-getter-prod

RUN apk add --no-cache wget

RUN wget --check-certificate https://delpa.org/melpa_snapshot_versions.json && \
    wget --check-certificate https://delpa.org/melpa_snapshot_versions.json.sha256
# ISO date in UTC
RUN echo $(date -I -u) | tee TODAY

# Verify that melpa_snapshot_versions.json is in the sha256 checksum file and
# verify checksum
RUN grep melpa_snapshot_versions.json melpa_snapshot_versions.json.sha256 && \
    sha256sum -c melpa_snapshot_versions.json.sha256

# Test snapshot versions
FROM snapshot-versions-getter-base as snapshot-versions-getter-test

COPY ./melpa_snapshot_versions.json .
# Mock date to the birthday of Delpa for testing purposes.
RUN echo 2025-01-02 > TODAY

FROM snapshot-versions-getter-${snapshot_versions_type} as snapshot-versions-getter


FROM docker.io/node:26.4.0-alpine@sha256:725aeba2364a9b16beae49e180d83bd597dbd0b15c47f1f28875c290bfd255b9 as caddyfile-builder

COPY package.json package-lock.json ./
RUN npm install -g npm && npm install
COPY . .
COPY --from=snapshot-versions-getter ./melpa_snapshot_versions.json ./TODAY ./
RUN env TODAY="$(cat TODAY)" npx tsx gen_caddy.ts > Caddyfile

FROM docker.io/caddy:2.11.4-alpine@sha256:5f5c8640aae01df9654968d946d8f1a56c497f1dd5c5cda4cf95ab7c14d58648

LABEL org.opencontainers.image.authors="Hong Xu <hong@topbug.net>"
LABEL org.opencontainers.image.title="Delpa Redirection Server"
LABEL org.opencontainers.image.source="https://github.com/delpa-org/redirection-server"
LABEL org.opencontainers.image.licenses=AGPL-3.0-or-later
LABEL org.opencontainers.image.url="https://delpa.org"

COPY --from=caddyfile-builder Caddyfile /etc/caddy/
