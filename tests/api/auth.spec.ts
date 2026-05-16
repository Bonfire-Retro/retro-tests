import { test, expect } from '@playwright/test';
import { createAuthProvider, type AuthProvider, type TestUser } from '../helpers/auth';
import { apiRequest } from '../helpers/api';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

let auth: AuthProvider;
let testUser: TestUser;

test.beforeAll(async () => {
  auth = createAuthProvider();
  testUser = await auth.createTestUser();
});

test.afterAll(async () => {
  await auth.deleteTestUser(testUser.username);
});

test('unauthenticated request returns 401', async () => {
  const response = await apiRequest('/api/teams');
  expect(response.status).toBe(401);
});

test('authenticated request returns 200', async () => {
  const token = await auth.getToken(testUser.username, testUser.password);
  const response = await apiRequest('/api/teams', { token });
  expect(response.status).toBe(200);
});

test('invalid token returns 401', async () => {
  const response = await apiRequest('/api/teams', { token: 'invalid-token' });
  expect(response.status).toBe(401);
});

test('configuration endpoint is public', async () => {
  const response = await fetch(`${API_BASE_URL}/api/configuration`);
  expect(response.status).toBe(200);
  const config = await response.json();
  expect(config.webAuthentication).toBeDefined();
  expect(config.webAuthentication.clientId).toBeTruthy();
});
