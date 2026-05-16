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
  const team = await createTeam(token, `E2E Thoughts Team ${Date.now()}`);
  teamId = team.id;
  const retro = await createRetro(token, teamId);
  retroId = retro.id;
});

test.afterAll(async () => {
  await deleteTeam(token, teamId);
  await auth.deleteTestUser(testUser.username);
});

test('add thought to retro', async () => {
  const response = await apiRequest(`/api/teams/${teamId}/retros/${retroId}/thoughts`, {
    method: 'POST',
    body: { message: 'E2E test thought', category: 'happy' },
    token,
  });
  expect(response.status).toBe(201);
  const location = response.headers.get('Location');
  expect(location).toContain('/thoughts/');
});

test('vote on a thought', async () => {
  const createResponse = await apiRequest(`/api/teams/${teamId}/retros/${retroId}/thoughts`, {
    method: 'POST',
    body: { message: 'Voteable thought', category: 'sad' },
    token,
  });
  const location = createResponse.headers.get('Location')!;
  const thoughtId = location.split('/').pop();

  const voteResponse = await apiRequest(
    `/api/teams/${teamId}/retros/${retroId}/thoughts/${thoughtId}/votes`,
    { method: 'PUT', token }
  );
  expect(voteResponse.status).toBe(204);
});
