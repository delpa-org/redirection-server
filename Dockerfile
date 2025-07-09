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
FROM docker.io/alpine:3.22.0@sha256:8a1f59ffb675680d47db6337b49d22281a139e9d709335b492be023728e11715 as snapshot-versions-getter-base

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


FROM docker.io/node:22.17.0-alpine@sha256:10962e8568729b0cfd506170c5a2d1918a2c10ac08c0e6900180b4bac061adc9 as caddyfile-builder

COPY package.json package-lock.json ./
RUN npm install -g npm && npm install
COPY . .
COPY --from=snapshot-versions-getter ./melpa_snapshot_versions.json ./TODAY ./
RUN env TODAY="$(cat TODAY)" npx tsx gen_caddy.ts > Caddyfile

FROM docker.io/caddy:2.10.0-alpine@sha256:e2e3a089760c453bc51c4e718342bd7032d6714f15b437db7121bfc2de2654a6

LABEL org.opencontainers.image.authors="Hong Xu <hong@topbug.net>"
LABEL org.opencontainers.image.title="Delpa Redirection Server"
LABEL org.opencontainers.image.source="https://github.com/delpa-org/redirection-server"
LABEL org.opencontainers.image.licenses=AGPL-3.0-or-later
LABEL org.opencontainers.image.url="https://delpa.org"

COPY --from=caddyfile-builder Caddyfile /etc/caddy/
