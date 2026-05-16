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
    `/api/teams/${teamId}/retros/${retroId}/share-tokens`,
    { method: 'POST', token }
  );
  expect(createResponse.status).toBe(201);
  const shareToken = await createResponse.json();
  expect(shareToken.token).toBeTruthy();

  const shareResponse = await apiRequest(`/api/share/${shareToken.token}`);
  expect(shareResponse.status).toBe(200);
  const shareData = await shareResponse.json();
  expect(shareData.teamId).toBeTruthy();
  expect(shareData.retroId).toBe(retroId);
});
