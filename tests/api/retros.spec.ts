import { test, expect } from '@playwright/test';
import { createAuthProvider, type AuthProvider, type TestUser } from '../helpers/auth';
import { apiRequest, createTeam, createRetro, deleteTeam } from '../helpers/api';

let auth: AuthProvider;
let testUser: TestUser;
let token: string;
let teamId: string;

test.beforeAll(async () => {
  auth = createAuthProvider();
  testUser = await auth.createTestUser();
  token = await auth.getToken(testUser.username, testUser.password);
  const team = await createTeam(token, `E2E Retro Team ${Date.now()}`);
  teamId = team.id;
});

test.afterAll(async () => {
  await deleteTeam(token, teamId);
  await auth.deleteTestUser(testUser.username);
});

test('create and list retros', async () => {
  const retro = await createRetro(token, teamId);
  expect(retro.id).toBeTruthy();

  const response = await apiRequest(`/api/teams/${teamId}/retros`, { token });
  expect(response.status).toBe(200);
  const retros = await response.json();
  expect(retros.some((r: { id: string }) => r.id === retro.id)).toBe(true);
});
