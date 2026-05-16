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
  // Clean up any teams created during tests
  const response = await apiRequest('/api/teams', { token });
  const teams = await response.json();
  for (const team of teams) {
    if (team.name.startsWith('E2E')) {
      await apiRequest(`/api/teams/${team.id}`, { method: 'DELETE', token });
    }
  }
  await auth.deleteTestUser(testUser.username);
});

test('create a team from the UI', async ({ page, context }) => {
  // Inject auth token via API to skip OIDC redirect for faster tests
  const configResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8080'}/api/configuration`);
  const config = await configResponse.json();

  // Set storage state to simulate logged-in user
  // This test needs to go through the login flow to get proper session
  await page.goto('/');
  await page.fill('input[name="username"], input[id="username"]', testUser.username);
  await page.fill('input[name="password"], input[id="password"]', testUser.password);
  await page.click('input[type="submit"], button[type="submit"]');
  await page.waitForURL(/.*localhost.*/);

  // Now create a team
  const teamName = `E2E UI Team ${Date.now()}`;
  await page.getByRole('textbox', { name: /team/i }).fill(teamName);
  await page.getByRole('button', { name: /create/i }).click();

  // Verify team appears
  await expect(page.getByText(teamName)).toBeVisible();
});
