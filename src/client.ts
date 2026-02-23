/**
 * Stage API client.
 * Talks to the Stage server over HTTP.
 */

export function getBaseUrl(): string {
  return process.env.STAGE_URL || "http://localhost:3000";
}


function sessionHeaders(sessionId: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Stage-Session": sessionId,
  };
}

export async function stagePost(
  path: string,
  body: unknown,
  sessionId?: string,
): Promise<any> {
  const url = `${getBaseUrl()}${path}`;
  const headers = sessionId
    ? sessionHeaders(sessionId)
    : { "Content-Type": "application/json" };
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stage ${res.status}: ${text}`);
  }
  return res.json();
}

export async function stageGet(
  path: string,
  sessionId?: string,
): Promise<any> {
  const url = `${getBaseUrl()}${path}`;
  const headers: Record<string, string> = sessionId
    ? { "X-Stage-Session": sessionId }
    : {};
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stage ${res.status}: ${text}`);
  }
  return res.json();
}

export async function stageDelete(
  path: string,
): Promise<any> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stage ${res.status}: ${text}`);
  }
  return res.json();
}
