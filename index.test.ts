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

const hostAddress = "https://localhost:3001" as const;
const delpaGitHubRawBaseUrl =
  "https://raw.githubusercontent.com/delpa-org" as const;

test("/ redirects to Delpa homepage", async () => {
  const response = await fetch(`${hostAddress}/`, {
    redirect: "manual",
  });
  expect(response.status).toBe(301);
  expect(response.headers.get("location")).toBe("https://delpa.org");
});

test("/health-check returns 200 with OK", async () => {
  const response = await fetch(`${hostAddress}/health-check`, {
    redirect: "manual",
  });
  expect(response.status).toBe(200);
  expect(await response.text()).toBe("OK");
});

describe("/melpa/snapshot", () => {
  const snapshotLeadingPathComp = "melpa/snapshot" as const;
  for (const [name, path] of [
    ["valid with a one-level subdir", "2024-01-01/a/b"],
    ["valid with a one-level subdir with a trailing slash", "2024-02-02/a/b/"],
    ["valid with a two-level subdir", "2024-01-01/a/b/c"],
    [
      "valid with a two-level subdir with a trailing slash",
      "2024-03-03/a/b/c/",
    ],
  ] as const) {
    test(`Redirect with valid URL under /shapshot: ${name}`, async () => {
      const response = await fetch(
        `${hostAddress}/${snapshotLeadingPathComp}/${path}`,
        {
          redirect: "manual",
        },
      );

      expect(response.status).toBe(301);
      expect(response.headers.get("location")).toBe(
        delpaGitHubRawBaseUrl +
          `/melpa-snapshot-${path.split("/")[0]}/refs/heads/master/packages/` +
          path.slice(
            path.indexOf("/") + 1, // Remove the top-level folder in path
          ),
      );
    });
  }

  for (const [name, path] of [
    ["without a trailing slash", "2024-01-01"],
    ["with a trailing slash", "2024-02-02/"],
  ] as const) {
    test(`Report OK with valid snapshot version at a root dir of /melpa/shapshot: ${name}`, async () => {
      const response = await fetch(
        `${hostAddress}/${snapshotLeadingPathComp}/${path}`,
        {
          redirect: "manual",
        },
      );

      expect(response.status).toBe(200);
      const responseText = await response.text();
      expect(responseText).toContain("valid snapshot version");
      expect(responseText).toContain(path.split("/")[0]);
    });
  }

  for (const [name, path] of [
    ["non-existing snapshot", "2025-01-01"],
    ["non-existing partially-matched snapshot", "2024-01"],
    ["non-existing with no subdir", "non-existing"],
    ["non-existing with no subdir but with a trailing slash", "non-existing/"],
    ["non-existing with a one-level subdir", "non-existing/a"],
    [
      "non-existing with a one-level subdir with a trailing slash",
      "non-existing/a/",
    ],
    ["non-existing with a two-level subdir", "non-existing/a/b"],
    [
      "non-existing with a two-level subdir with a trailing slash",
      "non-existing/a/b/",
    ],
  ] as const) {
    test(`Return 404 with invalid URL under /melpa/shapshot: ${name}`, async () => {
      const response = await fetch(
        `${hostAddress}/${snapshotLeadingPathComp}/${path}`,
        {
          redirect: "manual",
        },
      );

      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).toContain("text/plain");
      const responseText = await response.text();
      expect(responseText).toContain("404 Not Found");
      expect(responseText).toContain(
        `Invalid snapshot version: ${path.split("/")[0]}`,
      );
    });
  }
});

describe("/melpa/at-least-days-old", () => {
  const ageLeadingPathComp = "melpa/at-least-days-old" as const;
  for (const [name, path, snapshotVersion] of [
    ["without a trailing slash", "1", "2024-10-10"],
    ["with a trailing slash", "270/", "2024-03-03"],
  ] as const) {
    test(`Report OK with valid snapshot version at a root dir of /melpa/at-least-days-old: ${name}`, async () => {
      const response = await fetch(
        `${hostAddress}/${ageLeadingPathComp}/${path}`,
        {
          redirect: "manual",
        },
      );

      expect(response.status).toBe(200);
      const responseText = await response.text();
      expect(responseText).toBe(
        `${path.split("/")[0]} days old points to snapshot version ${snapshotVersion}.`,
      );
    });
  }
});
