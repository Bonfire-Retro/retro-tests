import { test, expect } from '@playwright/test';
import { createAuthProvider, type AuthProvider, type TestUser } from '../helpers/auth';
import { createTeam, createRetro, deleteTeam } from '../helpers/api';

let auth: AuthProvider;
let testUser: TestUser;
let token: string;
let teamId: string;
let retroId: string;

test.beforeAll(async () => {
  auth = createAuthProvider();
  testUser = await auth.createTestUser();
  token = await auth.getToken(testUser.username, testUser.password);
  const team = await createTeam(token, `E2E Actions ${Date.now()}`);
  teamId = team.id;
  const retro = await createRetro(token, teamId);
  retroId = retro.id;
});

test.afterAll(async () => {
  await deleteTeam(token, teamId);
  await auth.deleteTestUser(testUser.username);
});

test('create and complete action item from UI', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Login")');
  await page.fill('input[name="username"], input[id="username"]', testUser.username);
  await page.fill('input[name="password"], input[id="password"]', testUser.password);
  await page.click('input[type="submit"], button[type="submit"]');
  await page.waitForURL(/.*localhost.*/);

  // Navigate to team, then into the retro
  await page.getByText('E2E Actions').first().click();
  await page.getByRole('link', { name: /Happy, Confused, Sad/ }).click();

  // Fill in an action item in the right panel
  await page.getByPlaceholder('Enter Action Item').fill('Fix the build');
  await page.getByPlaceholder('Enter Assignee').fill('tester');
  await page.getByRole('button', { name: 'Add' }).click();

  // Verify the action item appears
  await expect(page.getByText('Fix the build')).toBeVisible();
});
