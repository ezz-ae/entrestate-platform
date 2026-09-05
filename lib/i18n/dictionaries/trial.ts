// The workspace's starting period, said to the customer.
//
// THE WORD "TRIAL" DOES NOT APPEAR ON A SCREEN. The owner: "forget free —
// free never sells again"; the offer is credit on the account, not days on a
// clock. The column is still `trial_ends_at` and the keys still say `trial`
// (renaming a key touches every computed-key guard for nothing a reader can
// see); what a person reads is "starting period" — the stretch before the
// first bill, which is what the date has always meant.
//
// Two states reach a screen — endingSoon and expired. `active`, `notOnTrial`
// and `unknown` render nothing at all, which is what every workspace looked
// like before this existed; a parse failure must not become a new sentence
// appearing on somebody's account.
//
// COMPUTED FAMILY: screens render t(`trial.state.${kind}`) off TRIAL_STATES in
// lib/tenancy/trial.ts, which `pnpm i18n` cannot see. Enumerated in
// scripts/dynamic-keys-test.ts against this file.
//
// The copy deliberately does not threaten. Nothing is switched off when a
// trial ends — there is nowhere to pay yet (see the header of
// lib/tenancy/trial.ts) — so a sentence implying a cut-off would be a lie the
// product could not carry out. It asks for a conversation, which is the thing
// that was actually missing.
type Dict = Record<string, string>

const en: Dict = {
  'trial.state.notOnTrial': '',
  'trial.state.active': '',
  'trial.state.unknown': '',
  'trial.state.endingSoon': 'Starting period ends in {days} days',
  'trial.state.expired': 'Starting period ended',

  'trial.endingSoonBody': 'Your workspace keeps working. Talk to us about staying on it.',
  'trial.expiredBody': 'Your workspace is still here and still yours. Let us sort out what comes next.',
  'trial.expiredDays': 'Ended {days} days ago',
  'trial.expiredToday': 'Ended today',
  'trial.oneDay': 'Starting period ends tomorrow',
  'trial.cta': 'Talk to us',
  'trial.dismiss': 'Later',
}

const ar: Dict = {
  'trial.state.notOnTrial': '',
  'trial.state.active': '',
  'trial.state.unknown': '',
  'trial.state.endingSoon': 'تنتهي فترة البداية خلال {days} أيام',
  'trial.state.expired': 'انتهت فترة البداية',

  'trial.endingSoonBody': 'مساحتك تعمل كما هي. تحدث معنا للاستمرار عليها.',
  'trial.expiredBody': 'مساحتك ما زالت هنا وما زالت لك. دعنا نتفق على الخطوة التالية.',
  'trial.expiredDays': 'انتهت قبل {days} يوم',
  'trial.expiredToday': 'انتهت اليوم',
  'trial.oneDay': 'تنتهي فترة البداية غداً',
  'trial.cta': 'تحدث معنا',
  'trial.dismiss': 'لاحقاً',
}

const ru: Dict = {
  'trial.state.notOnTrial': '',
  'trial.state.active': '',
  'trial.state.unknown': '',
  'trial.state.endingSoon': 'Стартовый период заканчивается через {days} дн.',
  'trial.state.expired': 'Стартовый период закончился',

  'trial.endingSoonBody': 'Рабочее пространство продолжает работать. Поговорите с нами, чтобы остаться на нём.',
  'trial.expiredBody': 'Пространство никуда не делось и остаётся вашим. Давайте решим, что дальше.',
  'trial.expiredDays': 'Закончился {days} дн. назад',
  'trial.expiredToday': 'Закончился сегодня',
  'trial.oneDay': 'Стартовый период заканчивается завтра',
  'trial.cta': 'Связаться с нами',
  'trial.dismiss': 'Позже',
}

export const trial = { en, ar, ru }
