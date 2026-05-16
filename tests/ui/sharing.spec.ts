import { test, expect } from '@playwright/test';
import { createAuthProvider, type AuthProvider, type TestUser } from '../helpers/auth';
import { apiRequest, createTeam, createRetro, deleteTeam } from '../helpers/api';

let auth: AuthProvider;
let testUser: TestUser;
let token: string;
let teamId: string;
let retroId: string;

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
    `/api/teams/${teamId}/retros/${retroId}/share-token`,
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
