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
  const actionItem = await createResponse.json();
  expect(actionItem.action).toBe('E2E test action');
  expect(actionItem.completed).toBe(false);

  const completeResponse = await apiRequest(
    `/api/teams/${teamId}/action-items/${actionItem.id}/complete`,
    { method: 'PUT', token }
  );
  expect(completeResponse.status).toBe(200);
});
