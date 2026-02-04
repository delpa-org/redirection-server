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
FROM docker.io/alpine:3.23.3@sha256:25109184c71bdad752c8312a8623239686a9a2071e8825f20acb8f2198c3f659 as snapshot-versions-getter-base

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


FROM docker.io/node:24.13.0-alpine@sha256:cd6fb7efa6490f039f3471a189214d5f548c11df1ff9e5b181aa49e22c14383e as caddyfile-builder

COPY package.json package-lock.json ./
RUN npm install -g npm && npm install
COPY . .
COPY --from=snapshot-versions-getter ./melpa_snapshot_versions.json ./TODAY ./
RUN env TODAY="$(cat TODAY)" npx tsx gen_caddy.ts > Caddyfile

FROM docker.io/caddy:2.10.2-alpine@sha256:d266901f6e0c9d74528463654b7e872e6af8f6bbe23ca13576a1fb601202f8da

LABEL org.opencontainers.image.authors="Hong Xu <hong@topbug.net>"
LABEL org.opencontainers.image.title="Delpa Redirection Server"
LABEL org.opencontainers.image.source="https://github.com/delpa-org/redirection-server"
LABEL org.opencontainers.image.licenses=AGPL-3.0-or-later
LABEL org.opencontainers.image.url="https://delpa.org"

COPY --from=caddyfile-builder Caddyfile /etc/caddy/
