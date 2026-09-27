import { test, expect, type Page } from '@playwright/test';
import { createAuthProvider, type AuthProvider, type TestUser } from '../helpers/auth';
import { apiRequest, createTeam, createRetro, deleteTeam } from '../helpers/api';

let auth: AuthProvider;
let testUser: TestUser;
let token: string;
let teamId: string;
let retroId: string;

async function login(page: Page, user: TestUser) {
  await page.goto('/');
  await page.click('button:has-text("Login")');
  await page.fill('input[name="username"], input[id="username"]', user.username);
  await page.fill('input[name="password"], input[id="password"]', user.password);
  await page.click('input[type="submit"], button[type="submit"]');
  await page.waitForURL(/.*localhost.*/);
}

async function createShareUrl(): Promise<string> {
  const createResponse = await apiRequest(
    `/api/teams/${teamId}/retros/${retroId}/share-tokens`,
    { method: 'POST', token }
  );
  const { token: shareToken } = await createResponse.json();
  return `${process.env.UI_BASE_URL || 'http://localhost:3000'}/share/${shareToken}`;
}

test.beforeAll(async () => {
  auth = createAuthProvider();
  testUser = await auth.createTestUser();
  token = await auth.getToken(testUser.username, testUser.password);
  const team = await createTeam(token, `E2E Share ${Date.now()}`);
  teamId = team.id;
  const retro = await createRetro(token, teamId);
  retroId = retro.id;
});

test.afterAll(async () => {
  await deleteTeam(token, teamId);
  await auth.deleteTestUser(testUser.username);
});

test('anonymous user can access retro via share link', async ({ page, context }) => {
  // Generate share token via API
  const createResponse = await apiRequest(
    `/api/teams/${teamId}/retros/${retroId}/share-tokens`,
    { method: 'POST', token }
  );
  const { token: shareToken } = await createResponse.json();

  // Open share link in a clean context (no auth)
  const anonContext = await page.context().browser()!.newContext();
  const anonPage = await anonContext.newPage();

  const shareUrl = `${process.env.UI_BASE_URL || 'http://localhost:3000'}/share/${shareToken}`;
  await anonPage.goto(shareUrl);

  // Should be able to see the retro without logging in
  await expect(anonPage).not.toHaveURL(/.*login.*|.*authorize.*/);

  await anonContext.close();
});

test('team member joining via share link sees the member view', async ({ page }) => {
  const shareUrl = await createShareUrl();

  await login(page, testUser);
  await page.goto(shareUrl);

  await expect(page).toHaveURL(new RegExp(`/teams/${teamId}/retros/${retroId}`));
  await expect(page.getByPlaceholder('Add a thought...').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'End Retro' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Share' })).toBeVisible();
});

test('logged in non-member joining via share link sees the anonymous view', async ({ browser }) => {
  const shareUrl = await createShareUrl();
  const outsider = await auth.createTestUser();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await login(page, outsider);
    await page.goto(shareUrl);

    await expect(page).toHaveURL(new RegExp(`/teams/${teamId}/retros/${retroId}`));
    await expect(page.getByPlaceholder('Add a thought...').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'End Retro' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Share' })).toHaveCount(0);
  } finally {
    await context.close();
    await auth.deleteTestUser(outsider.username);
  }
});
