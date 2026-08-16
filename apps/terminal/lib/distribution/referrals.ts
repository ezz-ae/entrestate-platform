import crypto from "node:crypto"

export type ReferralSignup = {
  id: string
  email: string
  referralCode?: string
  source?: string
  createdAt: string
}

const getStore = () => {
  if (!globalThis.__entrestateReferralStore) {
    globalThis.__entrestateReferralStore = [] as ReferralSignup[]
  }
  return globalThis.__entrestateReferralStore as ReferralSignup[]
}

declare global {
  // eslint-disable-next-line no-var
  var __entrestateReferralStore: ReferralSignup[] | undefined
}

export function recordReferralSignup(payload: Omit<ReferralSignup, "id" | "createdAt">): ReferralSignup {
  const record: ReferralSignup = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...payload,
  }
  getStore().push(record)
  return record
}

export function listReferralSignups(limit = 50): ReferralSignup[] {
  const store = getStore()
  return store.slice(-limit).reverse()
}
