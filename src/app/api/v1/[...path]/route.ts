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
    if (
      k !== "host" &&
      k !== "connection" &&
      k !== "content-length" &&
      k !== "transfer-encoding"
    ) {
      forwardHeaders.set(key, value);
    }
  });

  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    forwardHeaders.set("cookie", cookieHeader);
  } else {
    const allCookies = req.cookies.getAll();
    if (allCookies.length > 0) {
      forwardHeaders.set(
        "cookie",
        allCookies.map((c) => `${c.name}=${c.value}`).join("; ")
      );
    }
  }

  const method = req.method;
  let body: string | null = null;
  if (method !== "GET" && method !== "HEAD") {
    body = await req.text();
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body: body ? body : null,
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    upstreamRes.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "transfer-encoding") {
        responseHeaders.set(key, value);
      }
    });

    const responseBody = await upstreamRes.arrayBuffer();
    const response = new NextResponse(responseBody, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });

    const setCookies = upstreamRes.headers.getSetCookie
      ? upstreamRes.headers.getSetCookie()
      : [];

    for (const cookieStr of setCookies) {
      const parts = cookieStr.split(";").map((p) => p.trim());
      const [nameVal, ...attrs] = parts;
      const eqIdx = nameVal.indexOf("=");
      if (eqIdx > 0) {
        const name = nameVal.substring(0, eqIdx);
        const value = nameVal.substring(eqIdx + 1);
        let maxAge: number | undefined;
        let cookiePath = "/";
        let httpOnly = false;
        let sameSite: "lax" | "strict" | "none" = "lax";
        let secure = false;

        for (const attr of attrs) {
          const lower = attr.toLowerCase();
          if (lower.startsWith("max-age=")) {
            maxAge = parseInt(attr.substring(8), 10);
          } else if (lower.startsWith("path=")) {
            cookiePath = attr.substring(5);
          } else if (lower === "httponly") {
            httpOnly = true;
          } else if (lower.startsWith("samesite=")) {
            const ss = lower.substring(9);
            if (ss === "strict" || ss === "none" || ss === "lax") sameSite = ss;
          } else if (lower === "secure") {
            secure = true;
          }
        }

        response.cookies.set(name, value, {
          path: cookiePath,
          maxAge,
          httpOnly,
          sameSite,
          secure,
        });
      }
    }

    return response;
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
