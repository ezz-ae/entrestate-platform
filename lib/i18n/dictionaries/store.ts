// The App Store, said to the customer.
//
// Product NAMES and TAGLINES are not here on purpose: they live in
// lib/freehold/app-store.ts, which is the catalogue, and a product renamed in
// the catalogue must not keep its old name in one language. Only the chrome —
// headings, states, the honest note about billing — is translated.
//
// The note matters more than the rest. There is nowhere to pay yet: no
// entitlement record, no charge, no checkout. A store that shows a Buy button
// it cannot honour is worse than no store, so the page says what it is — a
// catalogue of what exists and what each product turns on — and asks for a
// conversation instead of pretending at a transaction.
type Dict = Record<string, string>

const en: Dict = {
  'store.title': 'App Store',
  'store.sub': 'What Entrestate sells, what each one turns on, and where it opens.',

  'store.note': 'This is the catalogue, not a checkout. Nothing here charges anything — ask us and we switch it on for your workspace.',

  'store.group.inWorkspace': 'Already in your workspace',
  'store.group.available': 'Available on your plan',
  'store.group.planned': 'Being built',

  'store.empty.inWorkspace': 'Nothing here yet.',
  'store.empty.available': 'Your plan already includes everything that is live.',
  'store.empty.planned': 'Nothing is waiting to be built.',

  'store.turnsOn': 'Turns on',
  'store.opens': 'Opens',
  'store.open': 'Open it',
  'store.plannedNote': 'The engine exists; the workspace does not yet.',
  'store.liteOf': 'A smaller {name}',
  'store.ask': 'Ask about this',

  'store.count': '{n} products',
}

const ar: Dict = {
  'store.title': 'متجر التطبيقات',
  'store.sub': 'ما تبيعه Entrestate، وما الذي يفعّله كل منتج، وأين يفتح.',

  'store.note': 'هذه قائمة المنتجات، وليست صفحة شراء. لا شيء هنا يخصم أي مبلغ — كلّمنا ونفعّله لمساحتك.',

  'store.group.inWorkspace': 'موجود بالفعل في مساحتك',
  'store.group.available': 'متاح على باقتك',
  'store.group.planned': 'قيد البناء',

  'store.empty.inWorkspace': 'لا شيء هنا بعد.',
  'store.empty.available': 'باقتك تشمل بالفعل كل ما هو جاهز.',
  'store.empty.planned': 'لا شيء ينتظر البناء.',

  'store.turnsOn': 'يفعّل',
  'store.opens': 'يفتح',
  'store.open': 'افتحه',
  'store.plannedNote': 'المحرّك موجود، أمّا المساحة فلم تُبنَ بعد.',
  'store.liteOf': 'نسخة أصغر من {name}',
  'store.ask': 'اسأل عنه',

  'store.count': '{n} منتجات',
}

const ru: Dict = {
  'store.title': 'Магазин приложений',
  'store.sub': 'Что продаёт Entrestate, что включает каждый продукт и где он открывается.',

  'store.note': 'Это каталог, а не оформление заказа. Здесь ничего не списывается — напишите нам, и мы включим это для вашего рабочего пространства.',

  'store.group.inWorkspace': 'Уже в вашем пространстве',
  'store.group.available': 'Доступно на вашем тарифе',
  'store.group.planned': 'В разработке',

  'store.empty.inWorkspace': 'Пока ничего.',
  'store.empty.available': 'Ваш тариф уже включает всё готовое.',
  'store.empty.planned': 'Ничего не ожидает разработки.',

  'store.turnsOn': 'Включает',
  'store.opens': 'Открывает',
  'store.open': 'Открыть',
  'store.plannedNote': 'Движок есть, рабочего пространства пока нет.',
  'store.liteOf': 'Уменьшенная версия {name}',
  'store.ask': 'Спросить об этом',

  'store.count': 'Продуктов: {n}',
}

export const store = { en, ar, ru }
