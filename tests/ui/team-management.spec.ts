import { test, expect } from '@playwright/test';
import { createAuthProvider, type AuthProvider, type TestUser } from '../helpers/auth';
import { apiRequest } from '../helpers/api';

let auth: AuthProvider;
let testUser: TestUser;
let token: string;

test.beforeAll(async () => {
  auth = createAuthProvider();
  testUser = await auth.createTestUser();
  token = await auth.getToken(testUser.username, testUser.password);
});

test.afterAll(async () => {
  const response = await apiRequest('/api/teams', { token });
  const teams = await response.json();
  for (const team of teams) {
    if (team.name.startsWith('E2E')) {
      await apiRequest(`/api/teams/${team.id}`, { method: 'DELETE', token });
    }
  }
  await auth.deleteTestUser(testUser.username);
});

test('create a team from the UI', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Login")');
  await page.fill('input[name="username"], input[id="username"]', testUser.username);
  await page.fill('input[name="password"], input[id="password"]', testUser.password);
  await page.click('input[type="submit"], button[type="submit"]');
  await page.waitForURL(/.*localhost.*/);

  // Click the + card to open the create team dialog
  await page.getByText('+').click();

  // Fill in team name and confirm
  const teamName = `E2E UI Team ${Date.now()}`;
  await page.getByPlaceholder('Team name').fill(teamName);
  await page.getByRole('button', { name: 'Confirm' }).click();

  // Verify team appears
  await expect(page.getByText(teamName)).toBeVisible();
});
