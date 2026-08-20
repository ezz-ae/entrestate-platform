// The trial, said to the customer.
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
  'trial.state.endingSoon': 'Trial ends in {days} days',
  'trial.state.expired': 'Trial ended',

  'trial.endingSoonBody': 'Your workspace keeps working. Talk to us about staying on it.',
  'trial.expiredBody': 'Your workspace is still here and still yours. Let us sort out what comes next.',
  'trial.expiredDays': 'Ended {days} days ago',
  'trial.expiredToday': 'Ended today',
  'trial.oneDay': 'Trial ends tomorrow',
  'trial.cta': 'Talk to us',
  'trial.dismiss': 'Later',
}

const ar: Dict = {
  'trial.state.notOnTrial': '',
  'trial.state.active': '',
  'trial.state.unknown': '',
  'trial.state.endingSoon': 'تنتهي التجربة خلال {days} أيام',
  'trial.state.expired': 'انتهت التجربة',

  'trial.endingSoonBody': 'مساحتك تعمل كما هي. تحدث معنا للاستمرار عليها.',
  'trial.expiredBody': 'مساحتك ما زالت هنا وما زالت لك. دعنا نتفق على الخطوة التالية.',
  'trial.expiredDays': 'انتهت قبل {days} يوم',
  'trial.expiredToday': 'انتهت اليوم',
  'trial.oneDay': 'تنتهي التجربة غداً',
  'trial.cta': 'تحدث معنا',
  'trial.dismiss': 'لاحقاً',
}

const ru: Dict = {
  'trial.state.notOnTrial': '',
  'trial.state.active': '',
  'trial.state.unknown': '',
  'trial.state.endingSoon': 'Пробный период заканчивается через {days} дн.',
  'trial.state.expired': 'Пробный период закончился',

  'trial.endingSoonBody': 'Рабочее пространство продолжает работать. Поговорите с нами, чтобы остаться на нём.',
  'trial.expiredBody': 'Пространство никуда не делось и остаётся вашим. Давайте решим, что дальше.',
  'trial.expiredDays': 'Закончился {days} дн. назад',
  'trial.expiredToday': 'Закончился сегодня',
  'trial.oneDay': 'Пробный период заканчивается завтра',
  'trial.cta': 'Связаться с нами',
  'trial.dismiss': 'Позже',
}

export const trial = { en, ar, ru }
