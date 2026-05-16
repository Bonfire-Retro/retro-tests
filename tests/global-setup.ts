import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';
const TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 1_000;

export default async function globalSetup() {
  const start = Date.now();
  while (Date.now() - start < TIMEOUT_MS) {
    try {
      await fetch(`${API_BASE_URL}/actuator/health`);
      return;
    } catch {
      // not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(`API at ${API_BASE_URL} did not become ready within ${TIMEOUT_MS / 1000}s`);
}
