export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Streams lightweight face-box events from the local AI detection service.
 * Keeping this server-side means browsers never need direct access to port 8000.
 */
export async function GET(request: Request) {
  const baseUrl = (
    process.env.AI_DETECTION_INTERNAL_URL ?? "http://127.0.0.1:8000"
  ).replace(/\/+$/, "");

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}/api/v1/live-bboxes`, {
      headers: { Accept: "text/event-stream" },
      cache: "no-store",
      signal: request.signal,
    });
  } catch {
    return Response.json(
      { message: "Layanan deteksi AI tidak dapat dihubungi" },
      { status: 503 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    return Response.json(
      { message: "Layanan deteksi AI menolak koneksi bbox" },
      { status: upstream.status || 502 },
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
