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

/** Briefly test a production image. Due to the changing snapshot versions and
 * netowrk dependencies when building an image, this isn't as thorough as the
 * test image.
 */

/** Host address. */
const hostAddress = process.env.HOST_ADDRESS ?? "https://localhost:3001";

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
  const snapshotLeadingPathComp = "/melpa/snapshot" as const;
  // Note: Test date 2025-12-01 will exceed the 270-day limit around 2026-08-28
  test("Redirect with valid URL under /melpa/shapshot", async () => {
    const response = await fetch(
      `${hostAddress}/${snapshotLeadingPathComp}/2025-12-01/subpath`,
      {
        redirect: "manual",
      },
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(
      delpaGitHubRawBaseUrl +
        "/melpa-snapshot-2025-12-01/refs/heads/master/packages/subpath",
    );
  });

  test("Report OK with valid snapshot version at a root dir of /shapshot", async () => {
    const response = await fetch(
      `${hostAddress}/${snapshotLeadingPathComp}/2025-12-01`,
      {
        redirect: "manual",
      },
    );

    expect(response.status).toBe(200);
    const responseText = await response.text();
    expect(responseText).toContain("valid snapshot version");
    expect(responseText).toContain("2025-12-01");
  });

  test("Return 404 with invalid URL under /shapshot", async () => {
    const response = await fetch(
      `${hostAddress}/${snapshotLeadingPathComp}/non-existing`,
      {
        redirect: "manual",
      },
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(await response.text()).toContain("404 Not Found");
  });
});

describe("/melpa/at-least-days-old", () => {
  const ageLeadingPathComp = "melpa/at-least-days-old" as const;
  test("Report OK with valid snapshot version at a root dir of /melpa/at-least-days-old", async () => {
    const response = await fetch(`${hostAddress}/${ageLeadingPathComp}/5`, {
      redirect: "manual",
    });

    expect(response.status).toBe(200);
    const responseText = await response.text();
    expect(responseText).toMatch(
      /5 days old points to snapshot version \d\d\d\d-\d\d-\d\d\./,
    );
  });

  test("Redirect to the corresponding snapshot given a file under /melpa/at-least-days-old", async () => {
    const response = await fetch(
      `${hostAddress}/${ageLeadingPathComp}/5/subpath/`,
      {
        redirect: "manual",
      },
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toMatch(
      new RegExp(
        `${delpaGitHubRawBaseUrl}/melpa-snapshot-\\d\\d\\d\\d-\\d\\d-\\d\\d/refs/heads/master/packages/subpath/`,
      ),
    );
  });

  test("404 for out-of-range number of days under /melpa/at-least-days-old", async () => {
    const response = await fetch(`${hostAddress}/${ageLeadingPathComp}/271`, {
      redirect: "manual",
    });

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("404 Not Found");
  });
});
