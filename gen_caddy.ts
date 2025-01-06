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

const snapVersionsRegexp = snapshotVersions.join("|");

const caddyfile = `
{
	admin off
}

{$HOST_ADDRESS:localhost} {
	redir / https://delpa.org permanent

	respond /health-check "OK"

	@snapshot path_regexp ^/snapshot/(${snapVersionsRegexp})/(.*)$
	redir @snapshot https://raw.githubusercontent.com/delpa-org/melpa-snapshot-{re.1}/refs/heads/master/packages/{re.2} permanent

	respond "404 Not Found" 404 {
		close
	}
}
`;

console.log(caddyfile);
