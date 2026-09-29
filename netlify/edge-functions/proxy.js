export default async function handler(request) {
  const backendUrl = Netlify.env.get("BACKEND_URL");

  if (!backendUrl) {
    console.error("BACKEND_URL is not configured");
    return new Response("Proxy backend is not configured", { status: 503 });
  }

  try {
    const incomingUrl = new URL(request.url);
    const upstreamUrl = new URL(
      incomingUrl.pathname + incomingUrl.search,
      backendUrl,
    );

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("x-forwarded-host");
    headers.delete("x-forwarded-proto");

    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: request.body,
      redirect: "manual",
    });

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.delete("connection");
    responseHeaders.delete("keep-alive");
    responseHeaders.delete("transfer-encoding");

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy request failed", error);
    return new Response("Proxy request failed", { status: 502 });
  }
}

export const config = {
  path: "/*",
};
