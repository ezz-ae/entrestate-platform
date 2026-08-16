export type GovernanceRole = "owner" | "admin" | "editor" | "viewer"

export type GovernancePermission =
  | "time_table:read"
  | "time_table:write"
  | "artifact:generate"
  | "distribution:publish"
  | "profile:write"
  | "audit:read"

export class AccessDeniedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AccessDeniedError"
  }
}

const ROLE_PERMISSIONS: Record<GovernanceRole, GovernancePermission[]> = {
  owner: [
    "time_table:read",
    "time_table:write",
    "artifact:generate",
    "distribution:publish",
    "profile:write",
    "audit:read",
  ],
  admin: [
    "time_table:read",
    "time_table:write",
    "artifact:generate",
    "distribution:publish",
    "profile:write",
    "audit:read",
  ],
  editor: ["time_table:read", "time_table:write", "artifact:generate", "profile:write"],
  viewer: ["time_table:read"],
}

export function hasPermission(role: GovernanceRole, permission: GovernancePermission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function assertPermission(role: GovernanceRole, permission: GovernancePermission) {
  if (!hasPermission(role, permission)) {
    throw new AccessDeniedError(`Role ${role} lacks permission ${permission}.`)
  }
}
