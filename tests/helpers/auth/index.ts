import { AuthProvider } from './types';
import { KeycloakAuthProvider } from './keycloak';
import { OidcAuthProvider } from './oidc';

export type { AuthProvider, TestUser } from './types';

export function createAuthProvider(): AuthProvider {
  const provider = process.env.AUTH_PROVIDER || 'keycloak';
  switch (provider) {
    case 'keycloak':
      return new KeycloakAuthProvider();
    case 'oidc':
      return new OidcAuthProvider();
    default:
      throw new Error(`Unknown AUTH_PROVIDER: ${provider}. Supported: keycloak, oidc`);
  }
}
