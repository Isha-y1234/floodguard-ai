export function getBackendServiceUrl() {
  return (process.env.BACKEND_INTERNAL_URL || "http://localhost:8000").replace(/\/+$/, "")
}