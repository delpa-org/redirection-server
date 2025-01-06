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

describe("/snapshot", () => {
  const snapshotFirstPathComp = "snapshot" as const;
  for (const [name, path] of [
    ["valid with a one-level subdir", "2025-01-02/a"],
    ["valid with a one-level subdir with a trailing slash", "2025-01-02/a/"],
    ["valid with a two-level subdir", "2025-01-02/a/b"],
    ["valid with a two-level subdir with a trailing slash", "2025-01-02/a/b/"],
  ] as const) {
    test(`Redirect with valid URL under /shapshot: ${name}`, async () => {
      const response = await fetch(
        `${hostAddress}/${snapshotFirstPathComp}/${path}`,
        {
          redirect: "manual",
        },
      );

      expect(response.status).toBe(301);
      expect(response.headers.get("location")).toBe(
        delpaGitHubRawBaseUrl +
          "/melpa-snapshot-2025-01-02/refs/heads/master/packages/" +
          path.slice(
            path.indexOf("/") + 1, // Remove the top-level folder in path
          ),
      );
    });
  }

  for (const [name, path] of [
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
    test(`Return 404 with invalid URL under /shapshot: ${name}`, async () => {
      const response = await fetch(
        `${hostAddress}/${snapshotFirstPathComp}/${path}`,
        {
          redirect: "manual",
        },
      );

      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).toContain("text/plain");
      expect(await response.text()).toBe("404 Not Found");
    });
  }
});
