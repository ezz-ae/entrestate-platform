export function getRequestContext(request: Request) {
  const teamId = request.headers.get("x-team-id") || "team_default"
  const userId = request.headers.get("x-user-id") || "user_system"
  return { teamId, userId }
}
