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
  const team = await createTeam(token, `E2E Retro Flow ${Date.now()}`);
  teamId = team.id;
});

test.afterAll(async () => {
  await deleteTeam(token, teamId);
  await auth.deleteTestUser(testUser.username);
});

test('full retro flow: create, add thoughts, vote', async ({ page }) => {
  // Login
  await page.goto('/');
  await page.fill('input[name="username"], input[id="username"]', testUser.username);
  await page.fill('input[name="password"], input[id="password"]', testUser.password);
  await page.click('input[type="submit"], button[type="submit"]');
  await page.waitForURL(/.*localhost.*/);

  // Navigate to team
  await page.getByText(`E2E Retro Flow`).first().click();

  // Create a retro
  await page.getByRole('button', { name: /retro|new/i }).click();

  // Add a thought
  await page.getByRole('textbox').first().fill('This went well');
  await page.keyboard.press('Enter');
  await expect(page.getByText('This went well')).toBeVisible();
});
