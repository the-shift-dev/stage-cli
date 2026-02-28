/**
 * Convex client for Stage CLI.
 * Talks directly to Convex backend.
 */

import { ConvexHttpClient } from "convex/browser";

let _client: ConvexHttpClient | null = null;
let _urlOverride: string | undefined;

export function setConvexUrl(url: string): void {
  _urlOverride = url;
  _client = null; // Reset client on URL change
}

export function getConvexUrl(): string {
  return _urlOverride || process.env.CONVEX_URL || "http://127.0.0.1:3210";
}

function getClient(): ConvexHttpClient {
  if (!_client) {
    _client = new ConvexHttpClient(getConvexUrl());
  }
  return _client;
}

interface ConvexResponse {
  status: "success" | "error";
  value?: any;
  errorMessage?: string;
}

// Generic mutation/query helpers
async function mutation(path: string, args: Record<string, unknown>): Promise<any> {
  const url = `${getConvexUrl()}/api/mutation`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const url = `${getConvexUrl()}/api/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

export async function createSnapshot(sessionId: string, name?: string): Promise<string> {
  return await mutation("createSnapshot", { sessionId, name });
}

export async function getSnapshots(sessionId: string): Promise<Array<{ name?: string; createdAt: number }>> {
  return await query("getSnapshots", { sessionId });
}

export async function getFileHistory(sessionId: string, path: string): Promise<Array<{ version?: number; createdAt?: number }>> {
  return await query("getFileHistory", { sessionId, path });
}
