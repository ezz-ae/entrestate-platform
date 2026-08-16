// Tokens — the realtor's money screen (buy tokens, see the runway, watch a
// request wait for a human to confirm the payment).
//
// Vocabulary note, because a money screen must not look like two currencies:
// EN calls the balance "tokens" (the Meta-for-Realtors product name), while
// AR and RU keep the wallet words already used on the broker credits screen —
// نقاط and кредиты. Both screens read the SAME balance row, so giving one
// number a second name inside one language is the confusion this rule avoids.
// Change the EN word if the product renames; do not fork the AR/RU words
// without renaming them on the credits screen in the same commit.
type Dict = Record<string, string>

const en: Dict = {
  'tok.title': 'Tokens',
  'tok.subtitle': 'Tokens pay for the ads you run. Nothing else.',
  'tok.balance': 'Your balance',
  'tok.balanceUnit': 'tokens',
  'tok.runway': 'About {days} days at AED {budget}/day',
  'tok.runwayUnknown': 'Set a daily budget to see how long this lasts',
  'tok.empty': 'No tokens yet',
  'tok.emptyBody': 'A campaign reserves tokens the moment it launches. Add some before your first launch.',
  'tok.buy': 'Add tokens',
  'tok.packCredits': '{n} tokens',
  'tok.packAed': 'AED {aed}',
  'tok.packRunway': '{days} days at AED 50/day',
  'tok.request': 'Request this pack',
  'tok.requesting': 'Sending…',
  'tok.requested': 'Requested',
  'tok.pending': 'Waiting on confirmation',
  'tok.pendingBody': 'We confirm the payment by hand, then the tokens land in this balance.',
  'tok.confirmed': 'Confirmed',
  'tok.rejected': 'Declined',
  'tok.history': 'Your requests',
  'tok.none': 'No requests yet',
  'tok.failed': 'Could not send that request. Please try again.',
  'tok.priceNote': 'One token funds AED 10 of ad spend.',
  'tok.cost': 'This launch reserves {n} tokens',
  'tok.costShort': '{n} tokens',
  'tok.short': 'Not enough tokens',
  'tok.shortBody': 'This launch needs {need} tokens; you have {have}.',
  'tok.topUp': 'Add tokens',
  'tok.loadFailed': 'Could not read your balance.',
}

const ar: Dict = {
  'tok.title': 'النقاط',
  'tok.subtitle': 'النقاط تدفع ثمن الإعلانات التي تشغّلها. لا شيء غير ذلك.',
  'tok.balance': 'رصيدك',
  'tok.balanceUnit': 'نقطة',
  'tok.runway': 'نحو {days} يوماً بميزانية {budget} درهم يومياً',
  'tok.runwayUnknown': 'حدّد ميزانية يومية لتعرف كم ستدوم',
  'tok.empty': 'لا نقاط بعد',
  'tok.emptyBody': 'الحملة تحجز النقاط لحظة إطلاقها. أضِف بعضها قبل أول إطلاق لك.',
  'tok.buy': 'إضافة نقاط',
  'tok.packCredits': '{n} نقطة',
  'tok.packAed': '{aed} درهم',
  'tok.packRunway': '{days} يوماً بميزانية 50 درهماً يومياً',
  'tok.request': 'اطلب هذه الباقة',
  'tok.requesting': 'جارٍ الإرسال…',
  'tok.requested': 'تم الطلب',
  'tok.pending': 'بانتظار التأكيد',
  'tok.pendingBody': 'نؤكّد الدفعة يدوياً، ثم تصل النقاط إلى هذا الرصيد.',
  'tok.confirmed': 'مؤكَّد',
  'tok.rejected': 'مرفوض',
  'tok.history': 'طلباتك',
  'tok.none': 'لا طلبات بعد',
  'tok.failed': 'تعذّر إرسال هذا الطلب. حاول مرة أخرى.',
  'tok.priceNote': 'النقطة الواحدة تموّل 10 دراهم من الإنفاق الإعلاني.',
  'tok.cost': 'هذا الإطلاق يحجز {n} نقطة',
  'tok.costShort': '{n} نقطة',
  'tok.short': 'النقاط غير كافية',
  'tok.shortBody': 'يحتاج هذا الإطلاق إلى {need} نقطة، ولديك {have}.',
  'tok.topUp': 'إضافة نقاط',
  'tok.loadFailed': 'تعذّرت قراءة رصيدك.',
}

const ru: Dict = {
  'tok.title': 'Кредиты',
  'tok.subtitle': 'Кредиты оплачивают только рекламу, которую вы запускаете. Больше ничего.',
  'tok.balance': 'Ваш баланс',
  'tok.balanceUnit': 'кредитов',
  'tok.runway': 'Примерно {days} дн. при бюджете {budget} AED в день',
  'tok.runwayUnknown': 'Укажите дневной бюджет, чтобы увидеть, на сколько этого хватит',
  'tok.empty': 'Кредитов пока нет',
  'tok.emptyBody': 'Кампания резервирует кредиты в момент запуска. Пополните баланс до первого запуска.',
  'tok.buy': 'Пополнить кредиты',
  'tok.packCredits': '{n} кредитов',
  'tok.packAed': '{aed} AED',
  'tok.packRunway': '{days} дн. при бюджете 50 AED в день',
  'tok.request': 'Запросить этот пакет',
  'tok.requesting': 'Отправка…',
  'tok.requested': 'Запрошено',
  'tok.pending': 'Ожидает подтверждения',
  'tok.pendingBody': 'Мы подтверждаем оплату вручную, и только потом кредиты поступают на этот баланс.',
  'tok.confirmed': 'Подтверждено',
  'tok.rejected': 'Отклонено',
  'tok.history': 'Ваши запросы',
  'tok.none': 'Запросов пока нет',
  'tok.failed': 'Не удалось отправить запрос. Попробуйте снова.',
  'tok.priceNote': 'Один кредит финансирует 10 AED рекламных расходов.',
  'tok.cost': 'Этот запуск резервирует {n} кредитов',
  'tok.costShort': '{n} кредитов',
  'tok.short': 'Недостаточно кредитов',
  'tok.shortBody': 'Для этого запуска нужно {need} кредитов, у вас {have}.',
  'tok.topUp': 'Пополнить кредиты',
  'tok.loadFailed': 'Не удалось прочитать ваш баланс.',
}

export const lm_tokens = { en, ar, ru }
