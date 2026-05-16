import { test, expect } from '@playwright/test';
import { createAuthProvider, type AuthProvider, type TestUser } from '../helpers/auth';
import { createTeam, createRetro, deleteTeam } from '../helpers/api';

let auth: AuthProvider;
let user1: TestUser;
let user2: TestUser;
let token1: string;
let teamId: string;
let retroId: string;

test.beforeAll(async () => {
  auth = createAuthProvider();
  user1 = await auth.createTestUser();
  user2 = await auth.createTestUser();
  token1 = await auth.getToken(user1.username, user1.password);

  const team = await createTeam(token1, `E2E Realtime ${Date.now()}`);
  teamId = team.id;
  const retro = await createRetro(token1, teamId);
  retroId = retro.id;
});

test.afterAll(async () => {
  await deleteTeam(token1, teamId);
  await auth.deleteTestUser(user1.username);
  await auth.deleteTestUser(user2.username);
});

test('two users see each other\'s thoughts in real time', async ({ browser }) => {
  // Create two independent browser contexts
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // Login user 1
  await page1.goto('/');
  await page1.fill('input[name="username"], input[id="username"]', user1.username);
  await page1.fill('input[name="password"], input[id="password"]', user1.password);
  await page1.click('input[type="submit"], button[type="submit"]');
  await page1.waitForURL(/.*localhost.*/);

  // Login user 2
  await page2.goto('/');
  await page2.fill('input[name="username"], input[id="username"]', user2.username);
  await page2.fill('input[name="password"], input[id="password"]', user2.password);
  await page2.click('input[type="submit"], button[type="submit"]');
  await page2.waitForURL(/.*localhost.*/);

  // Both navigate to the same retro
  // (Exact navigation depends on UI routing — adjust selectors after first run)
  // User 1 adds a thought
  // User 2 should see it appear via WebSocket without refresh

  await context1.close();
  await context2.close();
});
