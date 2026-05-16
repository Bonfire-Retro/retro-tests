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
  const team = await createTeam(token, `E2E Share Team ${Date.now()}`);
  teamId = team.id;
  const retro = await createRetro(token, teamId);
  retroId = retro.id;
});

test.afterAll(async () => {
  await deleteTeam(token, teamId);
  await auth.deleteTestUser(testUser.username);
});

test('generate and use share token', async () => {
  const createResponse = await apiRequest(
    `/api/teams/${teamId}/retros/${retroId}/share-token`,
    { method: 'POST', token }
  );
  expect(createResponse.status).toBe(200);
  const { token: shareToken } = await createResponse.json();
  expect(shareToken).toBeTruthy();

  const shareResponse = await apiRequest(`/api/share/${shareToken}`);
  expect(shareResponse.status).toBe(200);
});
