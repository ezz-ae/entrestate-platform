import { redirect } from 'next/navigation'

/**
 * /login — the address people type.
 *
 * Sign-in lives at /server and always has: it is where proxy.ts sends every
 * unauthenticated internal page, so moving it would mean changing the proxy,
 * the white-label gate and app/ctrl/layout.tsx together. But nothing in the
 * product ever tells a person that, and "entrestate.com/login" is the first
 * thing anyone tries. Before this file it fell through the vendor rules to the
 * property-marketing site's catch-all and landed on /business — a marketing
 * page, with no sign-in on it.
 *
 * So: one line, one destination, no second sign-in screen to drift out of sync
 * with the real one.
 */
export default function LoginAlias() {
  redirect('/server')
}
