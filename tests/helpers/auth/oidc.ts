import { AuthProvider, TestUser } from './types';

export class OidcAuthProvider implements AuthProvider {
  private readonly baseUrl: string;
  private readonly realm: string;
  private readonly clientId: string;

  constructor() {
    this.baseUrl = process.env.AUTH_BASE_URL || '';
    this.realm = process.env.AUTH_REALM || '';
    this.clientId = process.env.AUTH_CLIENT_ID || '';
  }

  async getToken(username: string, password: string): Promise<string> {
    const discoveryUrl = this.realm
      ? `${this.baseUrl}/realms/${this.realm}/.well-known/openid-configuration`
      : `${this.baseUrl}/.well-known/openid-configuration`;

    const discovery = await fetch(discoveryUrl).then(r => r.json());

    const response = await fetch(discovery.token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: this.clientId,
        username,
        password,
      }),
    });
    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status} ${await response.text()}`);
    }
    const data = await response.json();
    return data.access_token;
  }

  async createTestUser(): Promise<TestUser> {
    const username = process.env.E2E_TEST_USERNAME;
    const password = process.env.E2E_TEST_PASSWORD;
    if (!username || !password) {
      throw new Error('E2E_TEST_USERNAME and E2E_TEST_PASSWORD must be set for non-Keycloak providers');
    }
    return { username, password };
  }

  async deleteTestUser(): Promise<void> {
    // no-op: pre-provisioned users are not managed by tests
  }

  getAuthorityUrl(): string {
    return this.realm ? `${this.baseUrl}/realms/${this.realm}` : this.baseUrl;
  }
}
