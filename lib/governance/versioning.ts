import { hashObject } from "./hash"

export type ImmutableRecord<T> = T & {
  version: string
  hash: string
  sealedAt: string
  immutable: true
}

export function sealImmutable<T>(value: T, version = "v1"): ImmutableRecord<T> {
  const hash = hashObject({ version, value })
  return {
    ...(value as T),
    version,
    hash,
    sealedAt: new Date().toISOString(),
    immutable: true,
  }
}
