// Erkennt die Umgebung anhand von Hostname oder Port — analog zur Challenge-App
export function getEnvironment() {
  const { hostname, port } = window.location;
  const isDev = hostname.includes('-dev') || port === '8094' || port === '3003';
  return isDev ? 'DEV' : 'PROD';
}
