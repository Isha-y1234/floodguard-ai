import { getBackendServiceUrl } from "@/lib/backend-service-url"

type RouteContext = {
  params: Promise<{ path: string[] }>
}

async function proxyToBackend(request: Request, { params }: RouteContext) {
  const { path } = await params
  const incomingUrl = new URL(request.url)
  const backendUrl = new URL(
    path.map((segment) => encodeURIComponent(segment)).join("/"),
    `${getBackendServiceUrl()}/`,
  )
  backendUrl.search = incomingUrl.search

  const headers = new Headers()
  const contentType = request.headers.get("content-type")
  const accept = request.headers.get("accept")
  if (contentType) headers.set("content-type", contentType)
  if (accept) headers.set("accept", accept)

  const hasBody = request.method !== "GET" && request.method !== "HEAD"
  const backendResponse = await fetch(backendUrl, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
  })

  const responseHeaders = new Headers({ "cache-control": "no-store" })
  const responseContentType = backendResponse.headers.get("content-type")
  if (responseContentType) {
    responseHeaders.set("content-type", responseContentType)
  }

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  })
}

export async function GET(request: Request, context: RouteContext) {
  return proxyToBackend(request, context)
}

export async function POST(request: Request, context: RouteContext) {
  return proxyToBackend(request, context)
}