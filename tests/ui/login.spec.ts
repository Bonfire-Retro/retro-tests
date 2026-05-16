import { test, expect } from '@playwright/test';
import { createAuthProvider, type AuthProvider, type TestUser } from '../helpers/auth';

let auth: AuthProvider;
let testUser: TestUser;

test.beforeAll(async () => {
  auth = createAuthProvider();
  testUser = await auth.createTestUser();
});

test.afterAll(async () => {
  await auth.deleteTestUser(testUser.username);
});

test('redirects to auth provider and back after login', async ({ page }) => {
  await page.goto('/');

  // Should redirect to auth provider login page
  await expect(page).toHaveURL(/.*realms.*|.*authorize.*|.*login.*/);

  // Fill in credentials (Keycloak login form)
  await page.fill('input[name="username"], input[id="username"]', testUser.username);
  await page.fill('input[name="password"], input[id="password"]', testUser.password);
  await page.click('input[type="submit"], button[type="submit"]');

  // Should redirect back to the app
  await page.waitForURL(/.*localhost.*/);
  await expect(page).not.toHaveURL(/.*realms.*|.*authorize.*|.*login.*/);
});
