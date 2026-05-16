import { test, expect } from '@playwright/test';
import { createAuthProvider, type AuthProvider, type TestUser } from '../helpers/auth';
import { apiRequest, createTeam, deleteTeam } from '../helpers/api';

let auth: AuthProvider;
let testUser: TestUser;
let token: string;
let teamId: string;

test.beforeAll(async () => {
  auth = createAuthProvider();
  testUser = await auth.createTestUser();
  token = await auth.getToken(testUser.username, testUser.password);
  const team = await createTeam(token, `E2E ActionItem Team ${Date.now()}`);
  teamId = team.id;
});

test.afterAll(async () => {
  await deleteTeam(token, teamId);
  await auth.deleteTestUser(testUser.username);
});

test('create and complete action item', async () => {
  const createResponse = await apiRequest(`/api/teams/${teamId}/action-items`, {
    method: 'POST',
    body: { action: 'E2E test action', assignee: 'tester' },
    token,
  });
  expect(createResponse.status).toBe(201);
  const location = createResponse.headers.get('Location')!;
  const actionItemId = location.split('/').pop();

  const completeResponse = await apiRequest(
    `/api/teams/${teamId}/action-items/${actionItemId}/completed`,
    { method: 'PUT', body: { completed: true }, token }
  );
  expect(completeResponse.status).toBe(204);
});
