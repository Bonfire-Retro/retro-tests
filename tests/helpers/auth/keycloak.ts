import { AuthProvider, TestUser } from './types';

export class KeycloakAuthProvider implements AuthProvider {
  private readonly baseUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly adminUser: string;
  private readonly adminPassword: string;

  constructor() {
    this.baseUrl = process.env.AUTH_BASE_URL || 'http://localhost:8010';
    this.realm = process.env.AUTH_REALM || 'myrealm';
    this.clientId = process.env.AUTH_CLIENT_ID || 'retroquest-web';
    this.adminUser = process.env.AUTH_ADMIN_USER || 'admin';
    this.adminPassword = process.env.AUTH_ADMIN_PASSWORD || 'admin';
  }

  async getToken(username: string, password: string): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: this.clientId,
          username,
          password,
        }),
      }
    );
    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status} ${await response.text()}`);
    }
    const data = await response.json();
    return data.access_token;
  }

  async createTestUser(): Promise<TestUser> {
    const adminToken = await this.getAdminToken();
    const username = `e2e-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const password = 'testpass';

    const response = await fetch(
      `${this.baseUrl}/admin/realms/${this.realm}/users`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          enabled: true,
          credentials: [{ type: 'password', value: password, temporary: false }],
        }),
      }
    );
    if (!response.ok) {
      throw new Error(`Create user failed: ${response.status} ${await response.text()}`);
    }
    return { username, password };
  }

  async deleteTestUser(username: string): Promise<void> {
    const adminToken = await this.getAdminToken();

    const searchResponse = await fetch(
      `${this.baseUrl}/admin/realms/${this.realm}/users?username=${encodeURIComponent(username)}&exact=true`,
      { headers: { 'Authorization': `Bearer ${adminToken}` } }
    );
    const users = await searchResponse.json();
    if (users.length === 0) return;

    await fetch(
      `${this.baseUrl}/admin/realms/${this.realm}/users/${users[0].id}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` },
      }
    );
  }

  getAuthorityUrl(): string {
    return `${this.baseUrl}/realms/${this.realm}`;
  }

  private async getAdminToken(): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/realms/master/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: this.adminUser,
          password: this.adminPassword,
        }),
      }
    );
    if (!response.ok) {
      throw new Error(`Admin token request failed: ${response.status}`);
    }
    const data = await response.json();
    return data.access_token;
  }
}
