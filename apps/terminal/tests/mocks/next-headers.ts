export function headers() {
  return new Headers()
}

type CookieStore = {
  get: (name: string) => { name: string; value: string } | undefined
  getAll: () => Array<{ name: string; value: string }>
  set: (name: string, value: string) => void
  delete: (name: string) => void
}

export function cookies(): CookieStore {
  return {
    get: () => undefined,
    getAll: () => [],
    set: () => {},
    delete: () => {},
  }
}

export function draftMode() {
  return {
    isEnabled: false,
    enable: () => {},
    disable: () => {},
  }
}
