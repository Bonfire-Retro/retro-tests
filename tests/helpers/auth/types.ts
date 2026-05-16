export interface TestUser {
  username: string;
  password: string;
}

export interface AuthProvider {
  getToken(username: string, password: string): Promise<string>;
  createTestUser(): Promise<TestUser>;
  deleteTestUser(username: string): Promise<void>;
  getAuthorityUrl(): string;
}
