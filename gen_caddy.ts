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

import snapshotVersions from "./melpa_snapshot_versions.json" with { type: "json" };

const today = process.env.TODAY ? new Date(process.env.TODAY) : new Date();
const melpaSnapshotLeadingComp = "/melpa/snapshot" as const;
const melpaAgeLeadingComp = "/melpa/at-least-days-old" as const;
const snapshotVersionsRegexp = snapshotVersions.join("|");
// Snapshot versions from latest to oldest.
const maxAge = 270 as const; // We support <= 270 days old.

interface SnapshotVersionWithAge {
  version: string;
  ageRegexp: string; // age of the snapshot in days
}

/** Create a list of snapshots and their age regexps. Sorted from most recent to
 * least recent. */
function createSnapshotVersionWithAges(): SnapshotVersionWithAge[] {
  const sortedSnapshotVersions = snapshotVersions.toSorted().reverse();
  const ageRegexps: SnapshotVersionWithAge[] = [];
  let lastSnapshotAge = 0;
  for (const snapshotVersion of sortedSnapshotVersions) {
    const snapshotDate = new Date(snapshotVersion);
    const ageOfSnapshot = Math.min(
      maxAge,
      Math.floor(
        (today.getTime() - snapshotDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    const days = [...Array(ageOfSnapshot - lastSnapshotAge).keys()].map((i) =>
      (lastSnapshotAge + i + 1).toString(),
    );
    ageRegexps.push({ ageRegexp: days.join("|"), version: snapshotVersion });
    lastSnapshotAge = ageOfSnapshot;
    if (lastSnapshotAge >= maxAge) {
      break;
    }
  }
  return ageRegexps;
}

const snapshotVersionWithAges = createSnapshotVersionWithAges();

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

  route ${melpaSnapshotLeadingComp}/* {
    @valid-snapshot-root path_regexp ^${melpaSnapshotLeadingComp}/(${snapshotVersionsRegexp})/*$
    respond @valid-snapshot-root 200 {
      body "{re.1} is a valid snapshot version."
      close
    }
    @valid-snapshot path_regexp ^${melpaSnapshotLeadingComp}/(${snapshotVersionsRegexp})/(.*)$
    redir @valid-snapshot https://raw.githubusercontent.com/delpa-org/melpa-snapshot-{re.1}/refs/heads/master/packages/{re.2} permanent

    @invalid-snapshot path_regexp ^${melpaSnapshotLeadingComp}/([^/]+).*$
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

  # /melpa/at-least-days-old/{number}
  route ${melpaAgeLeadingComp}/* {
${snapshotVersionWithAges
  .map((snapshotVersionWithAge) => {
    const rootMatcherName =
      `@valid-age-root-${snapshotVersionWithAge.version}` as const;
    const pathMatcherName =
      `@valid-age-${snapshotVersionWithAge.version}` as const;
    return `
    ${rootMatcherName} path_regexp ^${melpaAgeLeadingComp}/(${snapshotVersionWithAge.ageRegexp})/*$
    respond ${rootMatcherName} 200 {
      body "{re.1} days old points to snapshot version ${snapshotVersionWithAge.version}."
      close
    }
    ${pathMatcherName} path_regexp ^${melpaAgeLeadingComp}/(${snapshotVersionWithAge.ageRegexp})/(.*)$
    rewrite ${pathMatcherName} ${melpaSnapshotLeadingComp}/${snapshotVersionWithAge.version}/{re.2}
    `;
  })
  .join("\n")}
  }
}
`;

console.log(caddyfile);
