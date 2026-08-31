# Behavioral WhatsApp Engagement Templates (Choice-Engine Triggers)
**Parent System**: Entrestate Intelligence OS [1, 99]  
**Trigger Event**: `RE_ENGAGEMENT_VELOCITY_SPIKE` (Detected after an active focus-after-idle state on `active_telemetry` tables)  
**Core Strategy**: Implicit choice-architecture. Zero direct questioning. Maximum context matching based on exact hover metrics (Floor Plans, Comparable Pricing, ROI Calculators).  
**Supported Languages**: English, العربية, Русский (Programmatically swapped by CRM locale detection) [36, 70]

---

## 1. Context Match: The ROI & Yield Calculator Hover
**Trigger Profile**: Lead spends >30 seconds actively adjusting or hovering over the ROI yield calculator block, then experiences a visibility-restore re-engagement spike.
**Goal**: Match their analytical, investor-focused state with hard yield variables.

### 🇬🇧 English (Corporate/Investor Focus)
> "Hi [Lead Name], this is [Broker Name] from Freehold Property. 
> 
> I noticed we just updated our internal ROI assessment models for JVC off-plan townhouses to include the latest developer payment plans. 
> 
> Since you are evaluating yield profiles in JVC, I wanted to share a structured comparative sheet. What is your target investment exit horizon?
> 
> 1️⃣ Short-term capital appreciation (exit before handover)  
> 2️⃣ Long-term stable rental yield (5 to 10-year hold)  
> 
> Let me know, and I’ll send the exact matching sheet."

### 🇦🇪 العربية (Arabic - Layout Flipped) [36]
> "مرحباً [اسم العميل]، معك [اسم المستشار] من Freehold Property.
> 
> لقد قمنا للتو بتحديث نماذج تقييم العائد الاستثماري (ROI) الخاصة بنا لمجمعات تاون هاوس JVC قيد الإنشاء لتشمل أحدث خطط الدفع المتاحة من المطورين.
> 
> بما أنك تقيّم عوائد الاستثمار في JVC، أود مشاركة ورقة مقارنة مهيكلة معك. ما هو الأفق الاستثماري المستهدف لعملية الخروج؟
> 
> 1️⃣ خروج استثماري سريع عن طريق إعادة البيع قبل التسليم (ربح رأس مالي)  
> 2️⃣ استثمار طويل الأجل لتحقيق عوائد إيجارية مستقرة (احتفاظ لمدة 5 إلى 10 سنوات)  
> 
> أخبرني برقم خيارك المفضل، وسأرسل لك ورقة المقارنة المطابقة لملفك الاستثماري."

### 🇷🇺 Russian (HNW Investor Focus)
> "Здравствуйте, [Имя Клиента]! На связи [Имя Брокера] из Freehold Property.
> 
> Мы только что обновили наши внутренние аналитические модели доходности (ROI) по таунхаусам на стадии строительства в районе JVC с учетом последних планов платежей от застройщиков.
> 
> Поскольку вы изучаете показатели доходности в JVC, я хотел бы поделиться с вами структурированной сравнительной таблицей. Каков ваш целевой инвестиционный горизонт выхода?
> 
> 1️⃣ Краткосрочная спекуляция (выход до сдачи объекта для фиксации прибыли)  
> 2️⃣ Долгосрочный арендный бизнес (удержание объекта от 5 до 10 лет)  
> 
> Дайте мне знать, и я отправлю вам соответствующую таблицу."

---

## 2. Context Match: The Floor Plan / Layout Hover
**Trigger Profile**: Lead spends >45 seconds zooming, toggling, or hovering over 2-bedroom or 3-bedroom structural layout vectors.
**Goal**: Engage their spatial, end-user or high-ticket investor curiosity without forcing a call.

### 🇬🇧 English (Visual/Direct)
> "Hi [Lead Name], [Broker Name] here from Freehold Property. 
> 
> We've just received the unreleased high-resolution corner-unit layout variants for the new launch in [Community Name]. 
> 
> I know you've been reviewing layouts in this category. Are you prioritizing a larger private garden space, or are you looking for an optimized post-handover payment plan?
> 
> 🌳 Option A: Corner plot with larger garden  
> 💳 Option B: Standard plot with extended payment plan  
> 
> Just reply with **A** or **B** and I will drop the corresponding layouts right here."

### 🇦🇪 العربية [36]
> "مرحباً [اسم العميل]، معك [اسم المستشار] من Freehold Property.
> 
> لقد استلمنا للتو المخططات الهندسية عالية الدقة والخاصة بالوحدات الركنية (Corner Units) الغير معلنة للمشروع الجديد في [اسم المنطقة].
> 
> أعلم أنك تراجع مخططات الوحدات في هذه الفئة. ما هي أولويتك الحالية؟ مساحة حديقة خاصة أكبر أم خطة دفع مرنة وممتدة بعد التسليم؟
> 
> 🌳 خيار (أ): وحدة ركنية مع حديقة أكبر  
> 💳 خيار (ب): وحدة قياسية مع خطة دفع ممتدة  
> 
> فقط أرسل لي حرف **أ** أو **ب** وسأرسل لك المخططات المطابقة فوراً."

### 🇷🇺 Russian
> "Здравствуйте, [Имя Клиента]! [Имя Брокера] из Freehold Property.
> 
> Мы только что получили эксклюзивные планировки угловых юнитов (Corner Units) в высоком разрешении для нового проекта в [Район]. Эти материалы еще не вышли в открытый доступ.
> 
> Я знаю, что вы изучаете планировки в этой категории. Что для вас сейчас в приоритете: увеличенный приватный сад или гибкий план рассрочки после сдачи объекта?
> 
> 🌳 Вариант А: Угловой участок с увеличенным садом  
> 💳 Вариант Б: Стандартный юнит с продленной рассрочкой  
> 
> Просто пришлите **А** или **Б**, и я отправлю вам нужные планировки сюда."

---

## 3. Context Match: The Comparative Market Data Hover
**Trigger Profile**: Lead spends >45 seconds actively inspecting the DLD comparative transactions list or area price trend charts.
**Goal**: Leverage authority. Speak the language of historical truth, metrics, and off-market opportunities.

### 🇬🇧 English (Authority & Metrics)
> "Hi [Lead Name], [Broker Name] from Freehold Property.
> 
> I saw that the Dubai Land Department (DLD) registered a major transaction cluster in [Community Name] this morning, driving comparable market pricing up by 4.2% over the last quarter.
> 
> We have managed to secure two distressed, off-market resales in this exact pocket that sit significantly below this new transaction average. What is your primary capital objective for this deployment?
> 
> 📈 Objective A: Maximum capital appreciation (undervalued off-plan entry)  
> 🛡️ Objective B: Risk mitigation (distressed ready property with stable cash flow)  
> 
> Reply with **A** or **B** to view the comparable ledger."

### 🇦🇪 العربية [36]
> "مرحباً [اسم العميل]، معك [اسم المستشار] من Freehold Property.
> 
> لقد سجلت دائرة الأراضي والأملاك في دبي (DLD) هذا الصباح مجموعة من الصفقات الكبرى في [اسم المنطقة]، مما رفع متوسط الأسعار المقارنة بنسبة 4.2% مقارنة بالربع الأخير.
> 
> نجحنا في تأمين وحدتين خارج السوق (Off-Market) بأسعار أقل بكثير من متوسط التداولات الجديد. ما هو هدفك المالي الأساسي حالياً؟
> 
> 📈 الهدف (أ): تحقيق أقصى نمو رأس مالي (دخول مبكر بأسعار أقل من قيمتها السوقية قيد الإنشاء)  
> 🛡️ الهدف (ب): حماية رأس المال (عقار جاهز بسعر لقطة مع تدفق نقدي مستقر)  
> 
> أرسل **أ** أو **ب** للاطلاع على سجل مقارنة الأسعار."

### 🇷🇺 Russian
> "Здравствуйте, [Имя Клиента]! На связи [Имя Брокера] из Freehold Property.
> 
> Сегодня утром Земельный департамент Дубая (DLD) зарегистрировал крупный пул сделок в районе [Район], что подняло среднюю рыночную стоимость аналогичных объектов на 4.2% за последний квартал.
> 
> Нам удалось эксклюзивно зарезервировать два срочных предложения (Distressed/Off-market) в этой локации, цены на которые существенно ниже средних рыночных показателей. Какова ваша главная финансовая цель на данный момент?
> 
> 📈 Цель А: Максимальный прирост капитала (покупка недооцененного объекта на стадии котлована)  
> 🛡️ Цель Б: Защита капитала (готовый объект по цене ниже рынка со стабильным арендным доходом)  
> 
> Напишите **А** или **Б**, чтобы получить доступ к сравнительному реестру."

---

## 🛠️ Programmatic Ingestion Rules
To prevent spamming clients, **Engine 07 (CRM)** and **Engine 10 (AI & Governance)** apply these strict programmatic routing rules:
1.  **Velocity Lock**: These messages can only be automatically drafted and queued for the broker if the lead's `re-engagement` velocity score is \\(V_{re} \ge 3.0\\) (multiple target hovers after an idle period) [13, 79].
2.  **No Overlap**: If the lead has been contacted within the last 12 hours, the automated trigger is suppressed [35].
3.  **The Gold Button Approval**: The system generates the customized WhatsApp message template dynamically on the agent's screen under the **Expert AI Desk**. The agent simply clicks the **"Gold Send Button"** to launch the message directly to the client's chat without needing to type or search [71, 72].
