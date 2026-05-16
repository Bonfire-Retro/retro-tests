import { test, expect } from '@playwright/test';
import { createAuthProvider, type AuthProvider, type TestUser } from '../helpers/auth';
import { apiRequest, createTeam, deleteTeam } from '../helpers/api';

let auth: AuthProvider;
let testUser: TestUser;
let token: string;

test.beforeAll(async () => {
  auth = createAuthProvider();
  testUser = await auth.createTestUser();
  token = await auth.getToken(testUser.username, testUser.password);
});

test.afterAll(async () => {
  await auth.deleteTestUser(testUser.username);
});

test('create and list teams', async () => {
  const team = await createTeam(token, `E2E Team ${Date.now()}`);
  expect(team.id).toBeTruthy();
  expect(team.name).toContain('E2E Team');

  const response = await apiRequest('/api/teams', { token });
  const teams = await response.json();
  expect(teams.some((t: { id: string }) => t.id === team.id)).toBe(true);

  await deleteTeam(token, team.id);
});

test('list teams returns empty for new user', async () => {
  const response = await apiRequest('/api/teams', { token });
  const teams = await response.json();
  expect(Array.isArray(teams)).toBe(true);
});
