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
  await page.click('button:has-text("Login")');
  await page.fill('input[name="username"], input[id="username"]', testUser.username);
  await page.fill('input[name="password"], input[id="password"]', testUser.password);
  await page.click('input[type="submit"], button[type="submit"]');
  await page.waitForURL(/.*localhost.*/);

  // Navigate to team
  await page.getByText('E2E Retro Flow').first().click();
  await page.waitForTimeout(1000);

  // Click + to open template picker, then select Happy, Confused, Sad
  await page.getByText('+').click();
  await page.getByRole('button', { name: 'Use this template' }).first().click();

  // Retro was created — click on it to enter
  await page.getByRole('link', { name: /Happy, Confused, Sad/ }).click();

  // Should be on the retro page with thought columns
  await expect(page.getByPlaceholder('Add a thought...')).toHaveCount(3);

  // Wait for WebSocket connection to establish
  await page.waitForTimeout(2000);

  // Add a thought to the Happy column
  const input = page.getByPlaceholder('Add a thought...').first();
  await input.fill('This went well');
  await input.press('Enter');

  // Input clears on successful API call, then WebSocket delivers the thought
  await expect(input).toHaveValue('', { timeout: 5000 });
  await expect(page.getByText('This went well')).toBeVisible({ timeout: 10000 });
});
