import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_URL || "http://127.0.0.1:8080";

async function proxyRequest(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const targetPath = path ? path.join("/") : "";
  const targetUrl = `${API_BASE_URL}/api/v1/${targetPath}${req.nextUrl.search}`;

  const forwardHeaders = new Headers();
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k !== "host" && k !== "connection" && k !== "content-length") {
      forwardHeaders.set(key, value);
    }
  });

  const method = req.method;
  let body: BodyInit | null = null;
  if (method !== "GET" && method !== "HEAD") {
    body = await req.arrayBuffer();
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body,
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    upstreamRes.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "transfer-encoding") {
        responseHeaders.set(key, value);
      }
    });

    const setCookies = upstreamRes.headers.getSetCookie
      ? upstreamRes.headers.getSetCookie()
      : [];
    if (setCookies.length > 0) {
      responseHeaders.delete("set-cookie");
      for (const cookie of setCookies) {
        responseHeaders.append("set-cookie", cookie);
      }
    }

    const responseBody = await upstreamRes.arrayBuffer();
    return new NextResponse(responseBody, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return NextResponse.json(
      {
        type: "https://iconfigly.dev/errors/upstream-unavailable",
        title: "Upstream Service Unavailable",
        status: 503,
        detail: err instanceof Error ? err.message : "API gateway connection error",
      },
      {
        status: 503,
        headers: { "Content-Type": "application/problem+json" },
      }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
