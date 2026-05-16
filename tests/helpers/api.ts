const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

export async function apiRequest(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {}
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

export async function createTeam(token: string, name: string): Promise<{ id: string; name: string }> {
  const response = await apiRequest('/api/teams', {
    method: 'POST',
    body: { name },
    token,
  });
  if (!response.ok) {
    throw new Error(`Create team failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

export async function createRetro(
  token: string,
  teamId: string,
  templateId: string = 'happy-sad-confused'
): Promise<{ id: string }> {
  const response = await apiRequest(`/api/teams/${teamId}/retros`, {
    method: 'POST',
    body: { templateId },
    token,
  });
  if (!response.ok) {
    throw new Error(`Create retro failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

export async function deleteTeam(token: string, teamId: string): Promise<void> {
  await apiRequest(`/api/teams/${teamId}`, { method: 'DELETE', token });
}
