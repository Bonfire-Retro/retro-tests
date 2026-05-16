import { test, expect } from '@playwright/test';
import { createAuthProvider, type AuthProvider, type TestUser } from '../helpers/auth';
import { createTeam, deleteTeam } from '../helpers/api';

let auth: AuthProvider;
let testUser: TestUser;
let token: string;
let teamId: string;

test.beforeAll(async () => {
  auth = createAuthProvider();
  testUser = await auth.createTestUser();
  token = await auth.getToken(testUser.username, testUser.password);
  const team = await createTeam(token, `E2E Actions ${Date.now()}`);
  teamId = team.id;
});

test.afterAll(async () => {
  await deleteTeam(token, teamId);
  await auth.deleteTestUser(testUser.username);
});

test('create and complete action item from UI', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[name="username"], input[id="username"]', testUser.username);
  await page.fill('input[name="password"], input[id="password"]', testUser.password);
  await page.click('input[type="submit"], button[type="submit"]');
  await page.waitForURL(/.*localhost.*/);

  // Navigate to team and action items section
  await page.getByText('E2E Actions').first().click();

  // Create action item
  await page.getByRole('textbox', { name: /action/i }).fill('Fix the build');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Fix the build')).toBeVisible();
});
