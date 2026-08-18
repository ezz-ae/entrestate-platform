// Calling — the connect screen for the voice provider.
//
// Two vocabulary rules, because this screen is read by people who will be
// asked about it by a regulator:
//
//  - "Verified" means the PROVIDER holds the number. It never means the tenant
//    typed it correctly. AR uses موثّق and RU Подтверждён, both of which carry
//    "confirmed by someone else" rather than "checked by me".
//  - The refusal sentences say what is blocked and what unblocks it, in the
//    same words the API returns, so a broker on the phone to support is
//    quoting one sentence and not two.
type Dict = Record<string, string>

const en: Dict = {
  'pcall.title': 'Calling',
  'pcall.subtitle': 'Outbound calls from your own number, on a script, to leads who agreed to be called.',

  // Setup guide
  'pcall.guide.1': 'Create a voice agent with the provider and copy its Agent ID.',
  'pcall.guide.2': 'Create an API key with Conversational AI access.',
  'pcall.guide.3': 'Register the brokerage number with the provider. Calls go out only from a number the provider holds.',

  // Connect form
  'pcall.apiKeyLabel': 'API key',
  'pcall.apiKeyPlaceholder': 'xi-…',
  'pcall.agentLabel': 'Agent ID',
  'pcall.agentPlaceholder': 'agent_…',
  'pcall.connect': 'Connect',
  'pcall.verifying': 'Checking the key…',
  'pcall.disconnect': 'Disconnect',
  'pcall.refresh': 'Refresh',
  'pcall.keyNote': 'The key is encrypted on this account and never sent back to the browser.',

  // Connection state
  'pcall.connected': 'Connected. Calls can be placed from a verified number.',
  'pcall.notConnected': 'No voice provider connected. No call can be placed.',
  'pcall.sourceEnv': 'Credentials come from the server environment. Connecting here changes nothing until ops clears them.',
  'pcall.sourceDb': 'Credentials are saved on this account, encrypted.',
  'pcall.providerSilent': 'The voice provider did not answer, so the number list below may be out of date.',

  // Caller ID
  'pcall.numbersTitle': 'Caller ID',
  'pcall.numbersLead': 'Calls go out from your own number. A number the provider has not verified is never used — showing a number you do not control is illegal and ends the account.',
  'pcall.verified': 'Verified',
  'pcall.pending': 'Not verified',
  'pcall.originOwn': 'Your number',
  'pcall.originPlatform': 'Platform number',
  'pcall.noNumbers': 'No numbers yet. Add the brokerage line, then register it with the provider.',
  'pcall.pendingNote': 'Waiting on the provider. Register this number in the provider console and it turns verified here on the next refresh.',
  'pcall.addNumber': 'Add a number',
  'pcall.numberPlaceholder': '+9715XXXXXXXX',
  'pcall.labelPlaceholder': 'Label — sales line',
  'pcall.add': 'Add',
  'pcall.remove': 'Remove',
  'pcall.badNumber': 'Enter the number in full international form, starting with +.',

  // Hours
  'pcall.windowTitle': 'Calling hours',
  'pcall.windowWhy': 'A call outside these hours is refused before the provider is contacted.',

  // What is blocked, and why a call gets refused
  'pcall.blockedTitle': 'Blocked right now',
  'pcall.blockedNotConnected': 'No provider connected — every call is refused.',
  'pcall.blockedNoNumber': 'No verified number — every call is refused.',
  'pcall.gatesTitle': 'A call is refused when',
  'pcall.gateConsent': 'The lead has no dated consent record, or the one on file is over a year old.',
  'pcall.gateWindow': 'It is outside Dubai calling hours, or inside the Friday prayer break.',
  'pcall.gateCadence': 'The lead was already called in the last 20 hours.',
  'pcall.gateDnc': 'The number is on the do-not-call list.',
  'pcall.gateCallerId': 'The caller-id number is not verified with the provider.',

  // Counts
  'pcall.statVerified': 'Verified numbers',
  'pcall.statPending': 'Waiting on verification',
  'pcall.statDnc': 'On do-not-call',
  'pcall.statCalls': 'Calls placed',

  // Errors
  'pcall.errGeneric': 'The voice provider did not answer.',
  'pcall.loadFailed': 'Could not read the calling status.',
}

const ar: Dict = {
  'pcall.title': 'المكالمات',
  'pcall.subtitle': 'مكالمات صادرة من رقمك أنت، بنص محدّد، إلى عملاء وافقوا على الاتصال بهم.',

  'pcall.guide.1': 'أنشئ وكيلاً صوتياً لدى المزوّد وانسخ معرّف الوكيل.',
  'pcall.guide.2': 'أنشئ مفتاح API بصلاحية Conversational AI.',
  'pcall.guide.3': 'سجّل رقم المكتب لدى المزوّد. المكالمات تخرج فقط من رقم يملكه المزوّد.',

  'pcall.apiKeyLabel': 'مفتاح API',
  'pcall.apiKeyPlaceholder': 'xi-…',
  'pcall.agentLabel': 'معرّف الوكيل',
  'pcall.agentPlaceholder': 'agent_…',
  'pcall.connect': 'ربط',
  'pcall.verifying': 'جارٍ التحقق من المفتاح…',
  'pcall.disconnect': 'فصل',
  'pcall.refresh': 'تحديث',
  'pcall.keyNote': 'المفتاح مشفّر على هذا الحساب ولا يُعاد إلى المتصفح أبداً.',

  'pcall.connected': 'مرتبط. يمكن إجراء المكالمات من رقم موثّق.',
  'pcall.notConnected': 'لا يوجد مزوّد صوت مرتبط. لا يمكن إجراء أي مكالمة.',
  'pcall.sourceEnv': 'بيانات الاعتماد تأتي من بيئة الخادم. الربط من هنا لا يغيّر شيئاً حتى يزيلها فريق التشغيل.',
  'pcall.sourceDb': 'بيانات الاعتماد محفوظة على هذا الحساب ومشفّرة.',
  'pcall.providerSilent': 'المزوّد لم يستجب، لذا قد تكون قائمة الأرقام أدناه قديمة.',

  'pcall.numbersTitle': 'الرقم الظاهر للعميل',
  'pcall.numbersLead': 'المكالمات تخرج من رقمك أنت. الرقم الذي لم يوثّقه المزوّد لا يُستخدم أبداً — إظهار رقم لا تملكه مخالف للقانون ويؤدي إلى إغلاق الحساب.',
  'pcall.verified': 'موثّق',
  'pcall.pending': 'غير موثّق',
  'pcall.originOwn': 'رقمك',
  'pcall.originPlatform': 'رقم المنصّة',
  'pcall.noNumbers': 'لا توجد أرقام بعد. أضف خط المكتب ثم سجّله لدى المزوّد.',
  'pcall.pendingNote': 'بانتظار المزوّد. سجّل هذا الرقم في لوحة المزوّد ليصبح موثّقاً هنا عند التحديث التالي.',
  'pcall.addNumber': 'إضافة رقم',
  'pcall.numberPlaceholder': '+9715XXXXXXXX',
  'pcall.labelPlaceholder': 'وصف — خط المبيعات',
  'pcall.add': 'إضافة',
  'pcall.remove': 'حذف',
  'pcall.badNumber': 'اكتب الرقم بالصيغة الدولية الكاملة بادئاً بعلامة +.',

  'pcall.windowTitle': 'ساعات الاتصال',
  'pcall.windowWhy': 'المكالمة خارج هذه الساعات تُرفض قبل مراسلة المزوّد.',

  'pcall.blockedTitle': 'ممنوع الآن',
  'pcall.blockedNotConnected': 'لا يوجد مزوّد مرتبط — كل مكالمة مرفوضة.',
  'pcall.blockedNoNumber': 'لا يوجد رقم موثّق — كل مكالمة مرفوضة.',
  'pcall.gatesTitle': 'تُرفض المكالمة عندما',
  'pcall.gateConsent': 'لا يوجد سجل موافقة مؤرّخ للعميل، أو الموافقة المسجّلة أقدم من سنة.',
  'pcall.gateWindow': 'الوقت خارج ساعات الاتصال في دبي، أو ضمن فترة صلاة الجمعة.',
  'pcall.gateCadence': 'تمّ الاتصال بالعميل خلال آخر 20 ساعة.',
  'pcall.gateDnc': 'الرقم مُدرج في قائمة عدم الاتصال.',
  'pcall.gateCallerId': 'الرقم الظاهر غير موثّق لدى المزوّد.',

  'pcall.statVerified': 'أرقام موثّقة',
  'pcall.statPending': 'بانتظار التوثيق',
  'pcall.statDnc': 'في قائمة عدم الاتصال',
  'pcall.statCalls': 'مكالمات تمّت',

  'pcall.errGeneric': 'المزوّد لم يستجب.',
  'pcall.loadFailed': 'تعذّرت قراءة حالة المكالمات.',
}

const ru: Dict = {
  'pcall.title': 'Звонки',
  'pcall.subtitle': 'Исходящие звонки с вашего номера, по сценарию, тем лидам, кто дал согласие.',

  'pcall.guide.1': 'Создайте голосового агента у провайдера и скопируйте Agent ID.',
  'pcall.guide.2': 'Создайте API-ключ с доступом к Conversational AI.',
  'pcall.guide.3': 'Зарегистрируйте номер агентства у провайдера. Звонки идут только с номера, который держит провайдер.',

  'pcall.apiKeyLabel': 'API-ключ',
  'pcall.apiKeyPlaceholder': 'xi-…',
  'pcall.agentLabel': 'Agent ID',
  'pcall.agentPlaceholder': 'agent_…',
  'pcall.connect': 'Подключить',
  'pcall.verifying': 'Проверяем ключ…',
  'pcall.disconnect': 'Отключить',
  'pcall.refresh': 'Обновить',
  'pcall.keyNote': 'Ключ шифруется на этом аккаунте и никогда не возвращается в браузер.',

  'pcall.connected': 'Подключено. Звонки можно ставить с подтверждённого номера.',
  'pcall.notConnected': 'Голосовой провайдер не подключён. Ни один звонок не пройдёт.',
  'pcall.sourceEnv': 'Учётные данные берутся из окружения сервера. Подключение здесь ничего не меняет, пока их не уберёт ops.',
  'pcall.sourceDb': 'Учётные данные сохранены на этом аккаунте, в зашифрованном виде.',
  'pcall.providerSilent': 'Провайдер не ответил, поэтому список номеров ниже может быть устаревшим.',

  'pcall.numbersTitle': 'Номер, который видит клиент',
  'pcall.numbersLead': 'Звонки идут с вашего номера. Номер, который провайдер не подтвердил, не используется никогда — показывать номер, которым вы не владеете, незаконно, и аккаунт закрывают.',
  'pcall.verified': 'Подтверждён',
  'pcall.pending': 'Не подтверждён',
  'pcall.originOwn': 'Ваш номер',
  'pcall.originPlatform': 'Номер платформы',
  'pcall.noNumbers': 'Номеров пока нет. Добавьте линию агентства и зарегистрируйте её у провайдера.',
  'pcall.pendingNote': 'Ждём провайдера. Зарегистрируйте номер в его консоли — здесь он станет подтверждённым при следующем обновлении.',
  'pcall.addNumber': 'Добавить номер',
  'pcall.numberPlaceholder': '+9715XXXXXXXX',
  'pcall.labelPlaceholder': 'Подпись — отдел продаж',
  'pcall.add': 'Добавить',
  'pcall.remove': 'Удалить',
  'pcall.badNumber': 'Введите номер в международном формате, начиная с +.',

  'pcall.windowTitle': 'Часы для звонков',
  'pcall.windowWhy': 'Звонок вне этих часов отклоняется до обращения к провайдеру.',

  'pcall.blockedTitle': 'Сейчас заблокировано',
  'pcall.blockedNotConnected': 'Провайдер не подключён — любой звонок отклоняется.',
  'pcall.blockedNoNumber': 'Нет подтверждённого номера — любой звонок отклоняется.',
  'pcall.gatesTitle': 'Звонок отклоняется, если',
  'pcall.gateConsent': 'У лида нет датированного согласия, либо оно старше года.',
  'pcall.gateWindow': 'Сейчас вне часов для звонков по Дубаю или в перерыв на пятничную молитву.',
  'pcall.gateCadence': 'Лиду уже звонили за последние 20 часов.',
  'pcall.gateDnc': 'Номер в списке «не звонить».',
  'pcall.gateCallerId': 'Номер для отображения не подтверждён у провайдера.',

  'pcall.statVerified': 'Подтверждённые номера',
  'pcall.statPending': 'Ждут подтверждения',
  'pcall.statDnc': 'В списке «не звонить»',
  'pcall.statCalls': 'Звонков сделано',

  'pcall.errGeneric': 'Провайдер не ответил.',
  'pcall.loadFailed': 'Не удалось прочитать статус звонков.',
}

export const p_calling = { en, ar, ru }
