import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { navigationForRole, publicNavigation, adminNavigation, backDestination, isCurrentDestination, resolveNavigationRole, navigationGroupsForAccess, canAccessAdmin } from "../src/config/navigation.mjs";

for (const role of ["visitor", "student", "admin", "unknown"]) {
  test(`${role}: menu has unique destinations and only existing routes`, () => {
    const links = navigationForRole(role);
    assert.equal(new Set(links.map((link) => link.href)).size, links.length);
    for (const link of links) {
      const [route, anchor] = link.href.split("#");
      assert.ok(existsSync(new URL(`../src/app${route === "/" ? "" : route}/page.js`, import.meta.url)), link.href);
      if (anchor) assert.ok(readFileSync(new URL("../src/app/page.js", import.meta.url), "utf8").includes(`id="${anchor}"`));
    }
    assert.equal(links.some((link) => link.href.startsWith("/admin")), role === "admin");
  });
}
test("administrator navigation requires a matching, current successful verification", () => {
  const account = { userId: "test-user", revision: 4 };
  assert.equal(resolveNavigationRole(account, { userId: "test-user", revision: 4, verified: true }), "admin");
  for (const check of [
    { userId: "another-user", revision: 4, verified: true },
    { userId: "test-user", revision: 3, verified: true },
    { userId: "test-user", revision: 4, verified: false },
    { userId: "test-user", revision: 4, verified: "true" },
  ]) assert.equal(resolveNavigationRole(account, check), null);
  assert.equal(resolveNavigationRole({ userId: null, revision: 4 }, { verified: true }), "visitor");
});
test("internal back links lead to their existing parent section", () => {
  assert.equal(backDestination("/"), null);
  assert.equal(backDestination("/admin"), null);
  assert.equal(backDestination("/admin/students").href, "/admin");
  assert.equal(backDestination("/admin/quizzes/7").href, "/admin/quizzes");
  assert.equal(backDestination("/quiz/7").href, "/quizzes");
  assert.equal(backDestination("/challenges/7").href, "/challenges");
});
test("active menu indicators do not activate every link on the homepage", () => {
  assert.equal(isCurrentDestination("/", "/"), true);
  assert.equal(isCurrentDestination("/quizzes", "/"), false);
  assert.equal(isCurrentDestination("/admin", "/admin/results"), false);
  assert.equal(isCurrentDestination("/admin/quizzes", "/admin/quizzes/7"), true);
  assert.equal(adminNavigation.length, 7);
  assert.equal(publicNavigation.length, 4);
});

for (const status of ["loading", "verifying", "visitor", "expired", "error", "unavailable"]) {
  test(`${status}: an unconfirmed or stale admin role never grants administration`, () => {
    const access = { status, role: "admin", canSignOut: true };
    assert.equal(canAccessAdmin(access), false);
    assert.ok(navigationGroupsForAccess(access).flatMap(group => group.links).every(link => !link.href?.startsWith("/admin")));
  });
}
test("student and unclassified signed-in accounts keep public routes and sign-out only", () => {
  for (const role of ["student", null]) {
    const links = navigationGroupsForAccess({ status: "authenticated", role, canSignOut: true }).flatMap(group => group.links);
    assert.equal(links.filter(link => link.action === "signOut").length, 1);
    assert.ok(links.every(link => !link.href?.startsWith("/admin") && link.href !== "/login"));
  }
});
test("verified teacher navigation is short and has no duplicate destinations", () => {
  const access = { status: "authenticated", role: "admin", canSignOut: true };
  assert.equal(canAccessAdmin(access), true);
  const links = navigationGroupsForAccess(access).flatMap(group => group.links);
  assert.equal(links.filter(link => link.href).length, 7);
  assert.equal(new Set(links.map(link => link.href || link.action)).size, links.length);
  assert.equal(canAccessAdmin({ ...access, signingOut: true }), false);
});
