# תוכנית מעבר מ-Airtable ל-Supabase + Admin App

> מסמך עבודה מקיף. עודכן לפי discovery עם Uri ב-25/5/2026 + סריקת schema מלאה.

## תוכן עניינים

1. [רקע ומטרות](#רקע-ומטרות)
2. [מודל הנתונים הקיים (Airtable)](#מודל-הנתונים-הקיים-airtable)
3. [תהליכי עסק](#תהליכי-עסק)
4. [אוטומציות קיימות](#אוטומציות-קיימות)
5. [ארכיטקטורה מוצעת](#ארכיטקטורה-מוצעת)
6. [מודל נתונים חדש (Supabase)](#מודל-נתונים-חדש-supabase)
7. [מודולים ב-Admin App](#מודולים-ב-admin-app)
8. [שלבי ביצוע](#שלבי-ביצוע)
9. [החלטות שנקבעו](#החלטות-שנקבעו)
10. [שאלות פתוחות](#שאלות-פתוחות)

---

## רקע ומטרות

**העסק**: הקליקה - השכרת חדרי טיפול ו-מנויי ססיה למטפלים (פסיכולוגים, קליניאים, רופאים, מטפלים אלטרנטיביים). שני מתחמים עיקריים (סוטין, יהודה הלוי) + עוד אופציות.

**הצוות**: הילית (בעלת העסק - עושה הכל) + אביגיל (עוזרת, יותר בלידים ושוטף). אין חלוקת תפקידים נוקשה.

**הלקוחות**: 3 סוגים -

1. **לקוחות ססיה/מנוי**: משלמים סכום חודשי קבוע, מקבלים משבצת קבועה בלוח (לדוגמה: כל שלישי 16:00-18:00 בחדר ספציפי) להתחייבות של X חודשים
2. **לקוחות כרטיסיה**: רוכשים בנק שעות (5/10/50/100 שעות) ומזמינים pay-as-you-go דרך Skedda
3. **משולב**: גם וגם

**כמות**: 185 לקוחות פעילים והיסטוריים, 843 לידים, ~10K שימושים (bookings).

**הבעיה ב-Airtable היום**:

- איטי עם הכמות הנוכחית (5 קריאות מקבילות ב-portal לוקחות 2-5 שניות)
- formulas מסובכות לחישוב יתרת שעות
- אין שליטה אמיתית על UX/workflows
- rate limits מציקים

**מטרה**:

1. **שלב 1**: החלפת Airtable כ-DB ב-Supabase. הפורטל הקיים ימשוך מ-Supabase.
2. **שלב 2**: Admin app חדש שמחליף לגמרי את Airtable Interface, מותאם לתהליכי העבודה היומיומיים.
3. **שלב 3 (עתידי)**: החלפת Skedda במערכת booking פנימית. **לא בסקופ של פרויקט זה**.

---

## מודל הנתונים הקיים (Airtable)

**Base ID**: `apps4j9M93A1VwJSR` (הקליקה)
**Schema מלא**: `docs/airtable-schema-raw.json` (91KB JSON)

### 18 טבלאות

| #   | טבלה                 | רשומות     | שדות   | תפקיד                                                                           |
| --- | -------------------- | ---------- | ------ | ------------------------------------------------------------------------------- |
| 1   | `לקוחות`             | 185        | **95** | כל המידע על לקוח: פרטים, סטטוס, יתרת שעות (formula), קישורים לכל הטבלאות האחרות |
| 2   | `חדרים`              | 57         | 9      | רשימת חדרים (~30 פעילים + היסטוריים)                                            |
| 3   | `ססיות`              | 118        | 24     | מנויי ססיה: יום קבוע, שעה, חדר, מחיר                                            |
| 4   | `כרטיסיות`           | **0**      | 22     | טבלה ריקה - הלוגיקה ב-`תשלומים` ישירות                                          |
| 5   | `שימושים` (bookings) | **10,576** | 39     | כל ה-bookings מ-Skedda + ידני                                                   |
| 6   | `תשלומים`            | 1,710      | 28     | תשלומי כרטיסיות + ססיה + חוזים עתידיים                                          |
| 7   | `ייבוא Skedda Raw`   | **10,648** | 18     | Buffer גולמי לפני שיוך                                                          |
| 8   | `לידים`              | 843        | 35     | צינור לידים מלא                                                                 |
| 9   | `התראות ומשימות`     | 433        | 7      | משימות לצוות                                                                    |
| 10  | `דוחות שימוש מסקדה`  | 20         | 3      | קבצי PDF/CSV מ-Skedda                                                           |
| 11  | `נוסחי הודעות`       | 42         | 11     | תבניות WhatsApp/מייל                                                            |
| 12  | `מתחמים`             | 4          | 3      | סוטין, יהודה הלוי, טשרנוביץ, אחר                                                |
| 13  | `עסקאות ססיה`        | 72         | 23     | חוזי ססיה עם הוראת קבע + תאריכים                                                |
| 14  | `תיעוד שיחות`        | 142        | 13     | Call log + הודעות מתוזמנות                                                      |
| 15  | `HAKLIKA TALK`       | 12         | 30     | לידים למטרה אחרת (dreamlab?) - יתאחד עם לידים                                   |
| 16  | `dreamlab`           | 3          | 6      | פרויקט נפרד/מבוטל                                                               |
| 17  | `מחירון ססיות`       | 23         | 2      | טבלת מחירים לפי שעות                                                            |
| 18  | `מדרגות הנחה`        | 2          | 2      | 1500+ ש"ח = 5% / 2500+ ש"ח = 10%                                                |

**סה"כ**: ~25K רשומות.

### לוגיקת יתרת שעות (היום ב-Airtable formula)

```
יתרה = SUM(שעות כרטיסיה שנרכשו from תשלומים where סוג='כרטיסיה')
     - SUM(משך בשעות from שימושים where Booking Title='שעתי')
     + קרדיט 2024 (עבר)
```

הכל מחושב ב-formula אחת בטבלת `לקוחות`. במעבר ל-Supabase: זה יהיה Postgres view או generated column.

---

## תהליכי עסק

### A. תהליך קליטת לקוח חדש

```
ליד נכנס (קמפיין/אורגני/הפניה)
    ↓ WhatsApp אוטומטי + רישום ב-Airtable
שיחה/פגישה ראשונה (הילית/אביגיל)
    ↓ אם רלוונטי
טופס קליטת לקוח (Fillout)
    ↓
החלטה על מסלול (ססיה / כרטיסיה / משולב)
    ↓
הכנת חוזה (טופס פנימי HTML ב-Make → Fill Faster)
    ↓
שליחת חוזה ללקוח (אוטומטי)
    ↓
חוזה נחתם → עדכון Airtable + הודעת המשך
    ↓
הוראת קבע נשלחה לאישור (אם ססיה)
    ↓
לקוח פעיל ✅
```

**Statuses**: `חדש` → `נשלח חוזה לחתימה` → `פעיל` → `מושהה` → `לא פעיל`
**Onboarding sub-statuses**: `נשלח חוזה` → `חוזה נחתם` → `התקבלו פרטי אשראי` → `נשלחה הוראת קבע לאישור` → `פולאו אפ`

### B. תהליך השכרה שעתית (כרטיסיה)

```
לקוח מתחבר ל-Skedda → רואה זמינות → מזמין → אישור מידי
    ↓
Skedda scraping (כל לילה) → Google Drive → Make webhook → Airtable
    ↓
שיוך אוטומטי ל-`שימושים` (לקוח, חדר, סטטוס)
    ↓
formula מעדכן יתרה
    ↓ אם יתרה < 0 או קרוב לסיום
התראה לצוות / הודעה ללקוח
```

### C. תהליך תשלום

**מסלול 1 - תשלום בכרטיסיה (Grow → חשבונית ירוקה)**:

```
לקוח קונה כרטיסיה דרך לינק (Grow)
    ↓ Make
תשלום עובר לחשבונית ירוקה → הפקת חשבונית
    ↓ Make
חשבונית ירוקה → Airtable (שיוך ללקוח, כמות שעות, פרטים)
```

**מסלול 2 - הוראת קבע (ססיה)**:

```
חוזה חתום → תשלומים עתידיים מנופקים שנה קדימה (Make)
    ↓ כל חודש
חיוב אוטומטי דרך מערכת הסליקה
    ↓
תשלום נכנס לחשבונית ירוקה → Make → Airtable
    ↓ אם איחור > 32 שעות מהוראת קבע
התראה לצוות
```

### D. תהליך לידים

```
ליד נכנס (פייסבוק/אינסטגרם/אורגני/הפניה)
    ↓ אוטומציה (Make + Fillout)
Airtable טבלת לידים + WhatsApp אוטומטי
    ↓
8:00 ו-14:00 כל יום → קבוצת WhatsApp פנימית עם רשימת לידים פתוחים
    ↓
הילית/אביגיל מתקשרות/כותבות
    ↓
תיעוד שיחה → טבלת תיעוד שיחות
    ↓ אם רלוונטי
המרה ללקוח (תהליך A)
```

---

## אוטומציות קיימות

### ב-Airtable (פנימיות)

| #   | טריגר                                        | תוצאה                        |
| --- | -------------------------------------------- | ---------------------------- |
| A1  | איחור בתשלום ססיה (>32 שעות מהוראת קבע)      | משימה ב-`התראות ומשימות`     |
| A2  | יתרת שעות לקוח < 0                           | משימה ב-`התראות ומשימות`     |
| A3  | תזמון הודעה ב-`תיעוד שיחות` הגיע לזמן השליחה | webhook ל-Make → שליחת הודעה |

### ב-Make

| #   | טריגר                                 | תוצאה                                                 |
| --- | ------------------------------------- | ----------------------------------------------------- |
| M1  | תשלום חדש (כרטיסיה/ססיה) או חוזה חתום | יצירת תשלומים עתידיים שנה קדימה ב-Airtable            |
| M2  | לקוח עבר ל-`לא פעיל` או רק כרטיסיות   | **חסר!** ביטול תשלומים עתידיים שנשארו                 |
| M3  | תשלום ב-Grow                          | העברה לחשבונית ירוקה להפקת חשבונית                    |
| M4  | תשלום חדש בחשבונית ירוקה              | הכנסה ל-Airtable + שיוך ללקוח + עדכון שעות אם כרטיסיה |
| M5  | כל לילה - Skedda scraping             | הורדת דוח → Google Drive → webhook → Airtable         |
| M6  | כל בוקר                               | דיווח למנהלים על שימושים שנכנסו אתמול                 |
| M7  | ליד חדש מקמפיין פייסבוק               | רישום ב-Airtable + WhatsApp אוטומטי                   |
| M8  | כל יום 8:00 ו-14:00                   | רשימת לידים פתוחים לקבוצת WhatsApp                    |
| M9  | מילוי טופס Fillout (ליד/קליטה/עדכון)  | רישום/עדכון ב-Airtable                                |
| M10 | טופס פנימי להכנת חוזה (HTML ב-Make)   | יצירת חוזה ב-Fill Faster + שליחה ללקוח                |
| M11 | חתימה על חוזה (Fill Faster)           | עדכון Airtable + הודעות השלמת תהליך                   |

**סה"כ**: לפחות 14 אוטומציות פעילות. כולן צריכות עדכון או החלפה במעבר ל-Supabase.

### 📊 סקירה מלאה מ-Make API (עודכן 25/5)

**60 scenarios סה"כ | 34 פעילים | 25 פעילים תלויים ב-Airtable**

3 folders: לידים (7) | תפעול שוטף (18) | קליטת לקוחות (7) | ללא folder (28)

#### Custom apps שזוהו

| App ID                    | מה זה                                                                           | בשימוש                                    |
| ------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------- |
| `app#greenapi-nuycxg`     | **Green API** - WhatsApp לצוות                                                  | 11 scenarios                              |
| `app#my-app-b90mkx`       | **Morning/חשבונית ירוקה** - addclient, transactions, receivedpayment, documents | 6+ scenarios                              |
| `app#shay-toolbox-l0v44z` | **Toolbox של שי** - HolidaysChecker (שבתות וחגים)                               | 3 scenarios                               |
| `app#testing-g3yhep`      | **Utility** - multipleSearchAndReplace (templates) + validateId (ת.ז.)          | 5+ scenarios                              |
| `manychat`                | **ManyChat** - WhatsApp Business                                                | **2 scenarios פעילים - כבר משולב חלקית!** |

#### Active scenarios שלא הוזכרו בשיחה

- `4017983` (53 modules) - Skedda → Drive → Sheets → Airtable (זה M5)
- `4234755` - HAKLIKA TALK טפסים (Fillout + ManyChat) - למיזם נפרד
- `4236872` (31) - **טופס Wix → Airtable** (lead intake נוסף)
- `4035598` (30) - טופס Fillout מתעניינים (lead intake נוסף)
- `3520754` (17) - **backend של כפתור "שליחת הודעה" באירטייבל** ⚠️ 5 DLQ
- `5096782` - **הפורטל כבר שולח webhooks ל-Make!** (שולח מייל כשלקוח מתחבר)
- `3832156` - **סטטוס לקוח משנה → מוחק תשלומים עתידיים** - תיקון! M2 לא חסר, הוא קיים.

#### 🚨 כשלים פעילים (Dead Letter Queue) - לטיפול לפני מיגרציה

| Scenario                           | DLQ items | חומרה                         |
| ---------------------------------- | --------- | ----------------------------- |
| `4943229` דפי תשלום grow           | **18**    | 🔴 קריטי - תשלומים שלא נכנסו! |
| `3520754` שליחת הודעות מותאמות     | 5         | 🟠 גבוה                       |
| `4752228` טפסי קמפיין (עומרי פוקס) | 4         | 🟠 גבוה                       |
| 3 נוספים                           | 1 כל אחד  | 🟡 נמוך                       |

#### 📁 קבצים מקומיים

- [docs/make-scenarios-list.json](make-scenarios-list.json) - רשימה בסיסית
- [docs/make-scenarios-detailed.json](make-scenarios-detailed.json) - פרטים מלאים
- [docs/make-blueprints/](make-blueprints/) - 60 blueprints (9 MB)
- [docs/make-audit-report.md](make-audit-report.md) - דוח קריא

---

## ארכיטקטורה מוצעת

```
┌────────────────────────────────────────────────────────────┐
│ External integrations                                       │
│ • Skedda (scraping)                                         │
│ • חשבונית ירוקה (תשלומים)                                   │
│ • Grow (סליקה)                                             │
│ • Fillout (טפסים ללקוחות)                                  │
│ • ManyChat (WhatsApp Business - בעתיד)                     │
│ • Green API (WhatsApp פנימי לצוות)                         │
└────────────┬──────────────────────────────┬────────────────┘
             │                              │
             ▼                              ▼
┌────────────────────────┐    ┌─────────────────────────────┐
│ Make (orchestration)   │    │ Direct integration          │
│ - 14 scenarios קיימים  │    │ (Supabase Edge Functions)   │
│ - עדכונים שנדרשים      │    │ - webhooks מתשלומים         │
└────────────┬───────────┘    └──────────────┬──────────────┘
             │                                │
             ▼                                ▼
┌────────────────────────────────────────────────────────────┐
│ Supabase                                                    │
│ • Postgres (DB ראשי)                                        │
│ • Auth (JWT + Google SSO ל-admin, magic links לפורטל)      │
│ • Storage (PDFs, attachments)                              │
│ • Edge Functions (webhooks, automations)                   │
│ • pg_cron (תזכורות יומיות)                                 │
│ • RLS policies                                              │
└────────┬─────────────────────────────────┬─────────────────┘
         │                                 │
         ▼                                 ▼
┌──────────────────┐              ┌──────────────────────────┐
│ Portal (קיים)    │              │ Admin app (חדש)          │
│ portal.haklika   │              │ admin.haklika            │
│ Next.js + Supabase│              │ Next.js + Supabase       │
│ קריאה בלבד       │              │ CRUD מלא + audit log     │
│ ללקוחות הקליקה   │              │ להילית + אביגיל          │
└──────────────────┘              └──────────────────────────┘
```

**Monorepo** עם Turborepo - שיתוף קוד (types, Supabase client, design tokens) בין הפורטל וה-admin.

---

## מודל נתונים חדש (Supabase)

### Schema ראשי

```sql
-- ============== טבלאות ליבה ==============

CREATE TABLE compounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                        -- סוטין, יהודה הלוי, ...
  whatsapp_group_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  compound_id uuid REFERENCES compounds(id),
  name text NOT NULL,
  room_type text,                            -- טיפול יחיד/קבוצות/אבחון
  address text,
  is_active boolean DEFAULT true,
  default_pricing text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- פרטים אישיים
  first_name text NOT NULL,
  last_name text NOT NULL,
  full_name text GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  billing_name text,                         -- שם לחשבונית
  phone text,
  email text,
  email_secondary text,
  birth_date date,
  national_id text,                          -- ת.ז.
  business_id text,                          -- חפ/עמ
  home_address text,

  -- מידע עסקי
  compound_id uuid REFERENCES compounds(id),
  status text NOT NULL DEFAULT 'חדש',         -- חדש/נשלח חוזה/פעיל/מושהה/לא פעיל
  onboarding_status text,                    -- נשלח חוזה/חוזה נחתם/...
  payment_type text,                         -- כרטיסיות בלבד/ססיה בלבד/ססיה וכרטיסיה/חדר שלם
  standby_status text,                       -- סטנד ביי
  standby_days text[],                       -- ראשון/שני/...

  -- צרכים וטיפול
  treatment_type text,                       -- סוג טיפול
  treatment_duration text,                   -- 60 דקות/50 דקות/...
  max_patients_in_room int DEFAULT 1,
  service_uses text[],                       -- שימושים מוצרים (מיטה/קבוצה/...)

  -- חוזה
  start_date date,
  commitment_months int,
  standing_order_start_date date,
  full_room_price numeric,
  full_room_cleaning_price numeric,
  full_room_furniture_price numeric,

  -- שיווק/מקור
  morning_client_id text,                    -- ID במערכת Morning

  -- שדות "אודות" (אופציונליים)
  about_me text,
  website_url text,
  instagram_url text,
  facebook_url text,
  other_url text,
  avg_patient_age text,
  patient_origin text,                       -- מהאיזור/מחוץ לעיר/...
  wants_promotion text,                      -- בטח/לא תודה/אולי

  -- מטא
  has_received_key boolean DEFAULT false,
  no_overage_alerts boolean DEFAULT false,
  no_low_balance_alerts boolean DEFAULT false,
  internal_notes text,
  customer_intake_summary text,
  contract_prep_summary text,
  legacy_credit_2024 numeric DEFAULT 0,      -- "קרדיט 2024" עבר

  -- timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_modified_by uuid REFERENCES auth.users(id)
);

CREATE TABLE customer_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  file_url text,                             -- Supabase Storage URL
  file_name text,
  signed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE customer_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============== ססיות (מנויים קבועים) ==============

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  status text NOT NULL DEFAULT 'פעיל',        -- פעיל/לא פעיל
  start_date date,
  day_of_week text,                          -- ראשון/שני/...
  start_time time,
  end_time time,
  room_id uuid REFERENCES rooms(id),
  hours_included int,                        -- שעות כלולות בחודש
  price_before_discount numeric,
  price_after_discount numeric,
  pricing_subscription text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE session_transactions (
  -- חוזי ססיה עם הוראת קבע
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  status text DEFAULT 'פעיל',
  start_date date,
  standing_order_start_date date,
  price_before_discount numeric,
  price_after_discount numeric,
  discount_percent numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============== תשלומים ==============

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  payment_type text NOT NULL,                -- כרטיסיה/ססיה/קורס/סדנא/אחר
  payment_method text,                       -- אשראי/מזומן/העברה/הוראת קבע
  status text DEFAULT 'שולם',                 -- שולם/ממתין/נכשל/בוטל/עתידי
  payment_date date NOT NULL,
  reference_number text,                     -- אסמכתא
  amount numeric NOT NULL,
  hours_purchased numeric,                   -- שעות כרטיסיה שנרכשו
  description_from_morning text,
  invoice_url text,
  invoice_file_url text,                     -- Supabase Storage
  session_transaction_id uuid REFERENCES session_transactions(id),
  session_id uuid REFERENCES sessions(id),
  compound_id uuid REFERENCES compounds(id),
  notes text,
  is_future_projected boolean DEFAULT false, -- תשלום עתידי (תחזית)
  created_at timestamptz DEFAULT now()
);

-- ============== Bookings (שימושים) ==============

CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  room_id uuid REFERENCES rooms(id),
  session_id uuid REFERENCES sessions(id),
  booking_title text,                        -- ססיה/שעתי/סדנה/קורס/חד פעמי/paid
  status text DEFAULT 'מתוכנן',               -- מתוכנן/בוצע/מבוטל
  source text,                               -- ידני/ייבוא שבועי/ייבוא היסטורי
  date date NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  duration_hours numeric GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_at - start_at)) / 3600.0
  ) STORED,
  revenue_per_use numeric,                   -- ההכנסה ממוצעת/בפועל
  source_import_id text,                     -- ID מ-Skedda
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX bookings_date_idx ON bookings(date);
CREATE INDEX bookings_customer_idx ON bookings(customer_id);
CREATE INDEX bookings_room_idx ON bookings(room_id);

-- ============== Skedda Raw Buffer ==============

CREATE TABLE skedda_raw_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE,
  start_at timestamptz,
  end_at timestamptz,
  duration_minutes int,
  activity_title text,
  first_name text,
  last_name text,
  email text,
  phone text,
  room_name text,
  price numeric,
  payment_status text,
  processed boolean DEFAULT false,
  matched_booking_id uuid REFERENCES bookings(id),
  error_notes text,
  created_at timestamptz DEFAULT now()
);

-- ============== לידים ==============

CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text DEFAULT 'main',              -- main/dreamlab (איחוד עם HAKLIKA TALK)
  name text NOT NULL,
  phone text,
  email text,
  status text DEFAULT 'פניה חדשה',            -- פניה חדשה/רלוונטי/לא רלוונטי/נסגר/...
  source text,                               -- פייסבוק קמפיין/אינסטגרם/אורגני/...
  lead_source_type text,                     -- קמפיין/אורגני/טלפון
  treatment_type text,
  rental_type text,                          -- ססיה קבועה/שעתית/חדר שלם/סדנא
  location text,                             -- מיקום מועדף
  meeting_location text,                     -- מיקום פגישה
  meeting_at timestamptz,
  follow_up_status text,
  customer_notes text,                       -- הערות שהליד נתן
  internal_notes text,                       -- הערות צוות
  task_helit text,
  task_avigail text,
  converted_to_customer_id uuid REFERENCES customers(id),
  last_follow_up_at timestamptz,
  excel_import_date date,
  created_at timestamptz DEFAULT now()
);

-- ============== Message Templates ==============

CREATE TABLE message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  category text,                             -- לידים/שוטף/קליטת לקוחות
  description text,
  image_url text,
  template_number int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============== Call Log + Scheduled Messages ==============

CREATE TABLE call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL,
  log_type text NOT NULL,                    -- שיחה טלפונית/הודעת וואטסאפ/תזמון הודעת וואטסאפ
  responsible text,                          -- הילית/אביגיל
  customer_id uuid REFERENCES customers(id),
  lead_id uuid REFERENCES leads(id),
  description text,
  scheduled_message_content text,
  scheduled_send_at timestamptz,
  sent_at timestamptz,
  send_status text,                          -- pending/sent/failed
  created_at timestamptz DEFAULT now()
);

CREATE INDEX call_logs_scheduled_idx ON call_logs(scheduled_send_at)
  WHERE send_status = 'pending';

-- ============== Tasks/Alerts ==============

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  lead_id uuid REFERENCES leads(id),
  title text NOT NULL,
  description text,
  status text DEFAULT 'לטיפול',               -- לטיפול/בטיפול/בוצע/תקוע
  priority text DEFAULT 'normal',
  due_at timestamptz,
  assigned_to uuid REFERENCES auth.users(id),
  source text,                               -- auto:balance-negative/auto:payment-late/manual
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- ============== Pricing ==============

CREATE TABLE session_pricing (
  -- מחירון ססיות לפי כמות שעות
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hours_per_month int NOT NULL,
  price numeric NOT NULL
);

CREATE TABLE discount_tiers (
  -- מדרגות הנחה: 1500+ ש"ח = 5% / 2500+ ש"ח = 10%
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_amount numeric NOT NULL,
  discount_percent numeric NOT NULL
);

-- ============== Audit Log ==============

CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL,                      -- insert/update/delete
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz DEFAULT now(),
  before_data jsonb,
  after_data jsonb,
  changes jsonb                              -- diff מצומצם
);

CREATE INDEX audit_log_record_idx ON audit_log(table_name, record_id);
CREATE INDEX audit_log_user_idx ON audit_log(changed_by, changed_at DESC);

-- ============== Views לחישובים ==============

CREATE VIEW customer_balance AS
SELECT
  c.id AS customer_id,
  c.legacy_credit_2024
  + COALESCE(SUM(p.hours_purchased) FILTER (WHERE p.payment_type = 'כרטיסיה' AND p.status = 'שולם'), 0)
  - COALESCE(SUM(b.duration_hours) FILTER (WHERE b.booking_title = 'שעתי' AND b.status != 'מבוטל'), 0)
  AS balance_hours
FROM customers c
LEFT JOIN payments p ON p.customer_id = c.id
LEFT JOIN bookings b ON b.customer_id = c.id
GROUP BY c.id, c.legacy_credit_2024;
```

### Migration mapping (Airtable → Supabase)

ראה `docs/airtable-schema-raw.json` עבור field IDs. נכתב migration script נפרד שמבצע:

1. דליית כל הטבלאות מ-Airtable API
2. המרה לפי mapping
3. שמירת `airtable_id` במטא (לcross-reference במהלך מעבר)
4. validation: counts + sums + balance per customer

---

## מודולים ב-Admin App

### 1. דאשבורד ראשי

- KPIs: לקוחות פעילים, הכנסות חודש נוכחי, ניצול חדרים, לידים פתוחים
- התראות אקטיביות: לקוחות במינוס יתרה, איחורי תשלום, לידים ללא מענה X ימים
- פעילות אחרונה (audit log אחרון)
- גרפים: הכנסות לאורך זמן, ניצול חדרים

### 2. ניהול לקוחות ⭐ הורחב

**List views (מרובות)**:

- כל הלקוחות (table view default)
- **Saved filters אישיים + שיתופיים** (כמו Airtable views) - כל משתמש יכול לשמור, אפשר לשתף עם הצוות
- ברירות מחדל: לפי מתחם, לפי סטטוס, לפי סוג תשלומים, לפי onboarding status
- **תצוגות עבודה (work alerts)**: לקוחות במינוס יתרה ⚠️ / כרטיסיה עומדת להיגמר (<3 שעות) / לקוחות שלא הופיעו X שבועות (churn risk)
- תצוגות נוספות: סטנד ביי לפי יום, ימי הולדת החודש, לקוחות חדשים, שעזבו, ללא חוזה
- **Display formats**: table / grid (cards עם תמונה) / compact

**כרטיס לקוח - 12 tabs**:

1. **Overview / סקירה אישית** ⭐ - KPIs: יתרה, ניצול חודשי, LTV, ססיה הבאה, תשלום הבא
2. **פרטים אישיים** - כל השדות + תמונה + "אודות"
3. **חוזה** - PDF + מחירים מותאמים
4. **ססיות** - מנויים פעילים והיסטוריים
5. **תשלומים** - היסטוריה + עתידיים + סטטיסטיקה
6. **Bookings** - היסטוריית שימושים (CRUD מלא)
7. **לוח שנה אישי** ⭐ - calendar עם כל ה-bookings והססיות (week/month view)
8. **משימות והערות צוות** ⭐ - timeline כרונולוגי
9. **תיעוד שיחות** - call log
10. **הודעות** - שליחה ידנית מ-templates + היסטוריה
11. **היסטוריית פעולות (audit log)** ⭐ - מי שינה מה ומתי
12. **קישורים** - אתר, אינסטגרם, פייסבוק, קבוצות WhatsApp

**כפתורי פעולה**: שליחת WhatsApp, שליחת טופס עדכון, הכנת חוזה, יצירת משימה

### 3. ניהול לידים

- צינור (kanban) לפי סטטוס: פניה חדשה → רלוונטי → נסגר
- View מאוחד ל-`לידים` + `HAKLIKA TALK` (עם category)
- שדות מפתח: מקור, סוג השכרה, מיקום, סוג טיפול
- Follow-up: לידים ללא מענה X ימים
- המרה ללקוח (כפתור)
- שליחת הודעה מ-template

### 4. ניהול ססיות וחוזים

- רשימת מנויים פעילים
- יצירת מנוי חדש: בחירת לקוח + יום + שעה + חדר + מחיר + הנחה
- חישוב הנחה אוטומטי לפי מדרגות
- מעקב אחר הוראות קבע
- חוזים: רשימת PDFs + שליחת חוזה (אינטגרציה עם Fill Faster - בעתיד)

### 5. ניהול תשלומים

- רשימה עם פילטרים: סוג, סטטוס, תאריך, לקוח, מתחם
- הוספת תשלום ידני
- שיוך לחשבונית (URL + קובץ)
- תשלומים עתידיים: צפי + ביטול לקוחות שעזבו
- ייבוא מחשבונית ירוקה (אוטומטי)

### 6. Bookings (CRUD מלא) ⭐ עודכן

- **כל אחד בצוות יכול להוסיף/לערוך/למחוק** (עם audit log מלא)
- Skedda נשאר source-of-truth לbookings רגילים מלקוחות, אבל admin app מאפשר:
  - **הוספה ידנית** - סדנאות, אירועים מיוחדים, ייבוא היסטורי
  - **עריכה** - תיקון שיוך לקוח/חדר/סטטוס, מעבר כרטיסיה↔ססיה (כמו היום ב-Airtable)
  - **ביטול/מחיקה**
- **התראה ויזואלית בולטת** בהוספת booking ידני (למנוע כפילות עם Skedda)
- List views: היום / השבוע / החודש / חודש שעבר / לפי חדר / לפי לקוח / ביטולים / חורגים
- **Skedda customer matching**: אם לקוח מ-Skedda לא קיים במערכת → **נוצר אוטומטית** עם status='חדש' (מסומן לבדיקה ידנית)

### 7. Calendar Views ⭐ חדש

- **Master calendar** - כל החדרים, כל ה-bookings (כמו Skedda אבל דינמי עם סינון לפי לקוח/חדר/סוג)
- **לוח לחדר ספציפי** - לראות ניצול ומי משתמש בחדר X
- **לוח ללקוח ספציפי** - calendar אישי (מופיע גם בכרטיס הלקוח)
- Day / Week / Month views

### 8. Skedda Raw (לdebug)

- צפייה ב-imports גולמיים
- שגיאות שיוך - matching ידני
- ייצוא היסטורי

### 9. משימות והתראות

- רשימה אישית (assigned_to)
- רשימה כללית
- יצירה ידנית
- אוטומטיים מ-rules (יתרה במינוס, איחור)

### 10. נוסחי הודעות

- ניהול templates עם משתנים ({{name}}, {{balance}}, וכו')
- קטגוריות: לידים / שוטף / קליטת לקוחות
- preview

### 11. תיעוד שיחות

- Call log לכל לקוח/ליד
- הודעות מתוזמנות (pending sends)
- הוספה ידנית

### 12. דוחות

- **הכנסות**: עבר/הווה/עתיד, לפי חודש/שנה/חדר/לקוח
- **ניצול חדרים**: שעות בחודש, אחוז ניצול, חדרים ריקים
- **לקוחות**: LTV, churn rate, חדשים, שעזבו
- **לידים**: מקור הגעה, אחוז המרה, זמן תגובה
- **ספקולציות**: "מה אם אעלה מחיר ב-10%?", "מה אם אוסיף חדר?"
- ייצוא ל-CSV/PDF

### 13. הגדרות

- מתחמים, חדרים
- מדרגות הנחה, מחירון ססיות
- משתמשי צוות + הרשאות
- אינטגרציות (Skedda, חשבונית ירוקה, ManyChat, Green API)
- ניהול templates של הודעות

### Cross-cutting features ⭐ חדש - פיצ'רים שחוצים את כל המודולים

- **Global search (Cmd+K)** - חיפוש מהיר על פני לקוחות / לידים / תשלומים / bookings
- **Recent items** - 10 רשומות שנפתחו לאחרונה
- **Favorites / pinned** - לקוחות "אהובים" שצריך לעקוב אחריהם
- **Bulk operations** - בחירה מרובה → פעולה (שליחת הודעה, עדכון סטטוס, ייצוא)
- **Export** - CSV / PDF / Excel מכל view
- **Mobile responsive** - הצוות לפעמים בשטח (טאבלט / טלפון)
- **Saved views אישיים ושיתופיים** - שמירה של פילטרים+סדר+עמודות, שיתוף עם הצוות (כמו Airtable)

---

## שלבי ביצוע

**עיקרון מנחה**: פיתוח עם seed data. מיגרציה אמיתית רק ב-cutover.

### Phase 0: POC (שבוע 1)

- הקמת Supabase project (free tier)
- מיגרציה של טבלת `לקוחות` בלבד (read-only)
- query speed test: SELECT עם JOIN, GROUP BY - השוואה ל-Airtable API
- אם POC מצליח (הוכחה <500ms ל-dashboard query) → ממשיכים

### Phase 1: Foundation (שבועות 2-4)

- מימוש schema מלא ב-Supabase (כל הטבלאות שזיהינו)
- Seed data ריאליסטי: 20 לקוחות, 5 מתחמים, 30 חדרים, מאות bookings/תשלומים
- RLS policies
- views ו-functions לחישוב יתרה
- Audit log triggers על כל הטבלאות
- Monorepo setup (Turborepo): apps/portal + apps/admin + packages/shared

### Phase 2: Portal Migration (שבועות 5-6)

- החלפת `src/lib/airtable/` ב-`src/lib/supabase/`
- אותו interface, אותה תוצאה
- בדיקה שהפורטל עובד זהה מול Supabase seed data
- **production עדיין על Airtable**

### Phase 3: Admin App - Core (שבועות 7-14)

לפי סדר עדיפויות:

1. Auth (Supabase Auth + Google SSO)
2. Layout + nav
3. ניהול לקוחות (CRUD + tabs)
4. ניהול תשלומים
5. ניהול ססיות + חוזים
6. Bookings view (read-only)
7. דאשבורד בסיסי

### Phase 4: Admin App - Advanced (שבועות 15-22)

1. ניהול לידים (kanban)
2. נוסחי הודעות
3. תיעוד שיחות + תזמון
4. משימות והתראות
5. דוחות
6. הגדרות

### Phase 5: Sync Layer (שבועות 23-25)

- Supabase Edge Functions לקבלת data מ-Make
- עדכון Make scenarios (14):
  - M1-M11 לעבוד מול Supabase
  - מיגרציה של M2 החסר (ביטול תשלומים עתידיים)
- בדיקה end-to-end עם seed data

### Phase 6: ManyChat Migration (שבועות 26-28)

- חיבור ManyChat ל-WhatsApp Business
- העברת flows מ-Green API ל-ManyChat (ללידים, שידור ללקוחות)
- שמירת Green API לפנים-צוותי
- בדיקות

### Phase 7: Cutover (שבוע 29)

- migration script: כל הנתונים מ-Airtable ל-Supabase production
- validation מלאה: counts, sums, balance per customer
- החלפת Make scenarios ל-Supabase
- שינוי portal production ל-Supabase
- מעבר admin app ל-production
- Airtable → read-only (גיבוי 60 יום)

### Phase 8: Stabilization (שבועות 30-32)

- מעקב + תיקוני באגים
- audit log review
- performance tuning
- documentation לצוות

**סה"כ**: ~32 שבועות / 7 חודשים בקצב נינוח (חלקיות זמן).

---

## החלטות שנקבעו

| נושא                | החלטה                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **גישת מיגרציה**    | פיתוח עם seed data, מיגרציה רק ב-cutover                                                    |
| **Admin auth**      | שם משתמש + סיסמה + Google SSO                                                               |
| **Audit log**       | כן, מפורט (מי/מתי/לפני/אחרי)                                                                |
| **Monorepo**        | Turborepo עם apps/portal + apps/admin + packages/shared                                     |
| **Skedda**          | נשאר. Booking system עצמאי בעתיד הרחוק                                                      |
| **WhatsApp**        | Green API → ManyChat (לקוחות). Green API נשאר לצוות                                         |
| **Fillout**         | נשאר ללקוחות. טופס הכנת חוזה פנימי - להעביר ל-admin                                         |
| **Fill Faster**     | נשאר לעת עתה. דחיית פיתוח חתימה דיגיטלית                                                    |
| **HAKLIKA TALK**    | מאוחד עם `leads` תחת `category='dreamlab'`                                                  |
| **כרטיסיות table**  | לא צריך (היא ריקה). הלוגיקה בתוך `payments`                                                 |
| **תשלומים עתידיים** | נשאר אבל לוגיקה משופרת + תיקון M2 החסר                                                      |
| **דוחות**           | הכנסות + ניצול חדרים + LTV + churn + lead funnel                                            |
| **התראות**          | ליד חדש, ליד ללא מענה, איחור תשלום, יתרה במינוס                                             |
| **מדרגות הנחה**     | 1500+ = 5%, 2500+ = 10% (table-driven)                                                      |
| **דאטה רטנשן**      | המלצה: שמור הכל. Postgres עם indexes טוב במיליוני שורות. אם בעתיד יהיה צורך - archive table |

---

## שאלות פתוחות / לבירור בהמשך

1. **שיעור המרה ליד → לקוח** - לא ידוע, נחשב מהנתונים אחרי מיגרציה
2. **חדרים פעילים מדויק** - ~30 אבל לא ידוע מספר מדויק. לסנן `is_active=true` במיגרציה
3. **תמהיל הכנסות ססיה vs כרטיסיה** - לא ידוע. נחשב בדוחות
4. **Skedda customer matching** - אם לקוח חדש מזמין דרך Skedda לפני שיש לו שורה ב-`customers`, מה קורה? (כנראה: זה לא יקרה כי הוא חייב להירשם קודם)
5. **Booking system עתידי** - לא בסקופ. מספר חודשים אחרי launch של admin app

---

## מסמכים נלווים

- `docs/airtable-schema-raw.json` - schema מלא של Airtable (91KB)
- `docs/migration-plan.md` - מסמך זה
- `~/.claude/plans/ticklish-singing-koala.md` - גרסה תמציתית של התוכנית
