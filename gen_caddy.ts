/** @license AGPL-3.0-or-later
 *
 * Copyright(C) 2025 Hong Xu <hong@topbug.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/** Generate the caddyfile. */

import snapshotVersions from "./snapshot_versions.json" with { type: "json" };

const snapshotVersionsRegexp = snapshotVersions.join("|");

const caddyfile = `
{
	admin off
}

{$HOST_ADDRESS:localhost} {
	redir / https://delpa.org permanent

  respond /health-check "OK" {
    close
  }

	respond "404 Not Found" 404 {
		close
	}

  route /snapshot/* {
    @valid-snapshot-root path_regexp ^/snapshot/(${snapshotVersionsRegexp})/*$
    respond @valid-snapshot-root 200 {
      body "{re.1} is a valid snapshot version."
      close
    }
    @valid-snapshot path_regexp ^/snapshot/(${snapshotVersionsRegexp})/(.*)$
    redir @valid-snapshot https://raw.githubusercontent.com/delpa-org/melpa-snapshot-{re.1}/refs/heads/master/packages/{re.2} permanent

    @invalid-snapshot path_regexp ^/snapshot/([^/]+).*$
    respond @invalid-snapshot 404 {

      body "404 Not Found. Invalid snapshot version: {re.1}

Currently this server thinks the following snapshots are valid:

${snapshotVersions
  .toSorted()
  .reverse()
  .map((v) => `- ${v}`)
  .join("\n")}

For more information, please visit the Delpa homepage: https://delpa.org"

      close
    }
  }
}
`;

console.log(caddyfile);
