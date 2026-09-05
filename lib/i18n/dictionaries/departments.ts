/**
 * The four departments and the rail — the words on the workspace's
 * navigation (lib/freehold/departments.ts, components/freehold/side-rail.tsx,
 * components/freehold/department-switcher.tsx).
 *
 * A department's name is what the owner called it; its blurb is one line a
 * newcomer reads in the switcher to know what is behind the door — benefit
 * before description, never the banned word.
 */
export const departments = {
  en: {
    'dept.market': 'Market Terminal',
    'dept.market.blurb': 'What the market is doing — before you spend on it.',
    'dept.inventory': 'Inventory System',
    'dept.inventory.blurb': 'Your stock, its score, and the pages built from it.',
    'dept.marketing': 'Campaigns & Marketing',
    'dept.marketing.blurb': 'From a scored listing to a live ad, through the gate.',
    'dept.crm': 'Lead Machine CRM',
    'dept.crm.blurb': 'Where the lead lands, who owns it, what happens next.',
    'dept.departments': 'Departments',
    'dept.switch': 'Switch department',
    'dept.company': 'Company',
    'dept.terminal': 'Open the Terminal',
    'dept.rail': 'Navigation',
    'dept.pin': 'Keep the rail open',
    'dept.unpin': 'Collapse the rail',
    'nav.fund': 'Fund',
    'nav.store': 'App Store',
  },
  ar: {
    'dept.market': 'تيرمينال السوق',
    'dept.market.blurb': 'ماذا يفعل السوق — قبل أن تنفق عليه.',
    'dept.inventory': 'نظام المخزون',
    'dept.inventory.blurb': 'مخزونك، وتقييمه، والصفحات المبنية منه.',
    'dept.marketing': 'الحملات والتسويق',
    'dept.marketing.blurb': 'من وحدة مقيَّمة إلى إعلان حي، عبر بوابة الإطلاق.',
    'dept.crm': 'Lead Machine CRM',
    'dept.crm.blurb': 'أين يصل العميل، ومن يملكه، وماذا يحدث بعد ذلك.',
    'dept.departments': 'الأقسام',
    'dept.switch': 'بدّل القسم',
    'dept.company': 'الشركة',
    'dept.terminal': 'افتح التيرمينال',
    'dept.rail': 'التنقل',
    'dept.pin': 'أبقِ الشريط مفتوحًا',
    'dept.unpin': 'اطوِ الشريط',
    'nav.fund': 'الرصيد',
    'nav.store': 'متجر التطبيقات',
  },
  ru: {
    'dept.market': 'Рыночный терминал',
    'dept.market.blurb': 'Что делает рынок — прежде чем вы на него потратитесь.',
    'dept.inventory': 'Система инвентаря',
    'dept.inventory.blurb': 'Ваш сток, его оценка и страницы, построенные на нём.',
    'dept.marketing': 'Кампании и маркетинг',
    'dept.marketing.blurb': 'От оценённого объекта до живой рекламы — через шлюз запуска.',
    'dept.crm': 'Lead Machine CRM',
    'dept.crm.blurb': 'Куда приходит лид, кто им владеет и что дальше.',
    'dept.departments': 'Отделы',
    'dept.switch': 'Сменить отдел',
    'dept.company': 'Компания',
    'dept.terminal': 'Открыть Терминал',
    'dept.rail': 'Навигация',
    'dept.pin': 'Держать панель открытой',
    'dept.unpin': 'Свернуть панель',
    'nav.fund': 'Фонд',
    'nav.store': 'Магазин приложений',
  },
} as const
