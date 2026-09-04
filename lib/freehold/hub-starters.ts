/**
 * THE SEVEN DOORS ON THE WORKSPACE HOME, and the three starters behind each.
 *
 * The home is arranged as a question — "How can the Expert help you, {name}?"
 * — with a composer and a row of doors beneath it. A door does not navigate;
 * it opens three STARTERS, each a concrete thing the system can do right now.
 * A starter is one of two kinds, and the kind is the whole contract:
 *
 *   ask   — a sentence handed to the docked Expert (sendToExpert), which runs
 *           its tools over this workspace's own data and answers from them.
 *           The sentence is written as the person would say it, in their
 *           language; it is the i18n TITLE of the starter, not a hidden
 *           English prompt, so what they clicked is exactly what was asked.
 *   href  — a builder or a screen the Expert cannot stand in for (the page
 *           builder, the web designer, finance). Opens it.
 *
 * Pure data: the component that renders it (components/freehold/starter-row)
 * and the guard (scripts/hub-starters-test.ts) both read this list, so a door
 * cannot exist without its three starters and their words in every language.
 */
import type { LucideIcon } from 'lucide-react'
import { Inbox, Radio, Building2, LayoutTemplate, Users, PhoneCall, Wallet } from 'lucide-react'

const FI = '/freehold-intelligence'

export type StarterKind = 'ask' | 'href'

export interface Starter {
  /** 1..3 — the i18n suffix: hub.arch.<door>.<n>.t / .s */
  n: 1 | 2 | 3
  kind: StarterKind
  /** Only for kind 'href'. */
  href?: string
}

export interface StarterDoor {
  id: 'leads' | 'ads' | 'listings' | 'pages' | 'team' | 'calling' | 'money'
  Icon: LucideIcon
  /** Where "View all" behind this door goes. */
  href: string
  starters: readonly [Starter, Starter, Starter]
}

export const STARTER_DOORS: readonly StarterDoor[] = [
  {
    id: 'leads', Icon: Inbox, href: `${FI}/crm`,
    starters: [
      { n: 1, kind: 'ask' },
      { n: 2, kind: 'ask' },
      { n: 3, kind: 'ask' },
    ],
  },
  {
    id: 'ads', Icon: Radio, href: `${FI}/ads-live`,
    starters: [
      { n: 1, kind: 'ask' },
      { n: 2, kind: 'ask' },
      { n: 3, kind: 'ask' },
    ],
  },
  {
    id: 'listings', Icon: Building2, href: `${FI}/inventory`,
    starters: [
      { n: 1, kind: 'ask' },
      { n: 2, kind: 'ask' },
      { n: 3, kind: 'ask' },
    ],
  },
  {
    id: 'pages', Icon: LayoutTemplate, href: `${FI}/inventory/landings`,
    starters: [
      { n: 1, kind: 'href', href: `${FI}/inventory/landings` },
      { n: 2, kind: 'ask' },
      { n: 3, kind: 'href', href: `${FI}/drive/web` },
    ],
  },
  {
    id: 'team', Icon: Users, href: `${FI}/management/team`,
    starters: [
      { n: 1, kind: 'ask' },
      { n: 2, kind: 'ask' },
      { n: 3, kind: 'ask' },
    ],
  },
  {
    id: 'calling', Icon: PhoneCall, href: `${FI}/crm/follow-up`,
    starters: [
      { n: 1, kind: 'ask' },
      { n: 2, kind: 'ask' },
      { n: 3, kind: 'ask' },
    ],
  },
  {
    id: 'money', Icon: Wallet, href: `${FI}/finance`,
    starters: [
      { n: 1, kind: 'ask' },
      { n: 2, kind: 'ask' },
      { n: 3, kind: 'href', href: `${FI}/finance` },
    ],
  },
] as const

export const STARTER_DOOR_IDS = STARTER_DOORS.map((d) => d.id)

/** The i18n keys a door renders — the label and, per starter, title + sub. */
export function starterKeys(door: StarterDoor): string[] {
  return [
    `hub.arch.${door.id}`,
    ...door.starters.flatMap((s) => [`hub.arch.${door.id}.${s.n}.t`, `hub.arch.${door.id}.${s.n}.s`]),
  ]
}
