/**
 * Convex client for Stage CLI.
 * Supports both Convex Cloud and self-hosted deployments.
 * 
 * Environment variables:
 *   Convex Cloud:
 *     CONVEX_URL - Deployment URL (e.g., https://xxx.convex.cloud)
 *   
 *   Self-hosted:
 *     CONVEX_SELF_HOSTED_URL - Backend URL (e.g., http://127.0.0.1:3210)
 *     CONVEX_SELF_HOSTED_ADMIN_KEY - Admin key for auth
 */

interface ConvexConfig {
  url: string;
  adminKey?: string;
  isSelfHosted: boolean;
}

let _configOverride: Partial<ConvexConfig> | null = null;

export function setConvexConfig(config: Partial<ConvexConfig>): void {
  _configOverride = config;
}

export function getConvexConfig(): ConvexConfig {
  // Check for overrides first
  if (_configOverride?.url) {
    return {
      url: _configOverride.url,
      adminKey: _configOverride.adminKey,
      isSelfHosted: _configOverride.isSelfHosted ?? true,
    };
  }

  // Check for Convex Cloud
  const cloudUrl = process.env.CONVEX_URL;
  if (cloudUrl) {
    return {
      url: cloudUrl,
      isSelfHosted: false,
    };
  }

  // Check for self-hosted
  const selfHostedUrl = process.env.CONVEX_SELF_HOSTED_URL;
  const selfHostedKey = process.env.CONVEX_SELF_HOSTED_ADMIN_KEY;
  if (selfHostedUrl) {
    return {
      url: selfHostedUrl,
      adminKey: selfHostedKey,
      isSelfHosted: true,
    };
  }

  // Default to local self-hosted
  return {
    url: "http://127.0.0.1:3210",
    isSelfHosted: true,
  };
}

export function getConvexUrl(): string {
  return getConvexConfig().url;
}

// For backwards compatibility
export function setConvexUrl(url: string): void {
  setConvexConfig({ url, isSelfHosted: true });
}

interface ConvexResponse {
  status: "success" | "error";
  value?: any;
  errorMessage?: string;
}

// Generic mutation/query helpers
async function mutation(path: string, args: Record<string, unknown>): Promise<any> {
  const config = getConvexConfig();
  const url = `${config.url}/api/mutation`;
  
  const headers: Record<string, string> = { 
    "Content-Type": "application/json" 
  };
  
  // Add admin key for self-hosted
  if (config.isSelfHosted && config.adminKey) {
    headers["Authorization"] = `Convex ${config.adminKey}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ path: `stage:${path}`, args }),
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Convex error ${res.status}: ${text}`);
  }
  
  const data = await res.json() as ConvexResponse;
  if (data.status === "error") {
    throw new Error(data.errorMessage || "Unknown error");
  }
  return data.value;
}

async function query(path: string, args: Record<string, unknown>): Promise<any> {
  const config = getConvexConfig();
  const url = `${config.url}/api/query`;
  
  const headers: Record<string, string> = { 
    "Content-Type": "application/json" 
  };
  
  // Add admin key for self-hosted
  if (config.isSelfHosted && config.adminKey) {
    headers["Authorization"] = `Convex ${config.adminKey}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ path: `stage:${path}`, args }),
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Convex error ${res.status}: ${text}`);
  }
  
  const data = await res.json() as ConvexResponse;
  if (data.status === "error") {
    throw new Error(data.errorMessage || "Unknown error");
  }
  return data.value;
}

// Stage API
export async function createSession(): Promise<string> {
  return await mutation("createSession", {});
}

export async function writeFile(sessionId: string, path: string, content: string): Promise<{ path: string; version: number; size: number }> {
  return await mutation("writeFile", { sessionId, path, content });
}

export async function readFile(sessionId: string, path: string): Promise<{ path: string; content: string; version?: number } | null> {
  return await query("readFile", { sessionId, path });
}

export async function getAllFiles(sessionId: string): Promise<Array<{ path: string; content: string; version?: number }>> {
  return await query("getAllFiles", { sessionId });
}

export async function triggerRender(sessionId: string, entry?: string): Promise<{ entry: string; version: number }> {
  return await mutation("triggerRender", { sessionId, entry });
}

export async function getRenderState(sessionId: string): Promise<{ entry: string; version: number } | null> {
  return await query("getRenderState", { sessionId });
}

export interface SessionStatus {
  session: {
    createdAt: number;
    lastAccessedAt: number;
  } | null;
  render: {
    entry: string;
    version: number;
    error: string | null;
    renderedAt: number | null;
  } | null;
  files: Array<{
    path: string;
    version: number;
    size: number;
  }>;
}

export async function getStatus(sessionId: string): Promise<SessionStatus> {
  return await query("getStatus", { sessionId });
}

export async function createSnapshot(sessionId: string, name?: string): Promise<string> {
  return await mutation("createSnapshot", { sessionId, name });
}

export async function getSnapshots(sessionId: string): Promise<Array<{ name?: string; createdAt: number }>> {
  return await query("getSnapshots", { sessionId });
}

export async function getFileHistory(sessionId: string, path: string): Promise<Array<{ version?: number; createdAt?: number }>> {
  return await query("getFileHistory", { sessionId, path });
}

// Helper to show current config
export function printConfig(): void {
  const config = getConvexConfig();
  console.log(`Mode: ${config.isSelfHosted ? "self-hosted" : "cloud"}`);
  console.log(`URL: ${config.url}`);
  if (config.isSelfHosted && config.adminKey) {
    console.log(`Admin key: ${config.adminKey.slice(0, 20)}...`);
  }
}
