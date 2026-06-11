# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# פורטל הקליקה — הנחיות לקלוד קוד

## סקירה

שתי אפליקציות באותו repo:

1. **פורטל לקוח** (`(dashboard)`) - קריאה בלבד ל-177 לקוחות של הקליקה (בית למטפלים since 2018). כל לקוח רואה רק את הנתונים שלו: יתרת שעות, היסטוריית רכישות, bookings, ססיות פעילות, תשלומים.
2. **אפליקציית אדמין** (`(admin)`) - CRM פנימי לצוות: לקוחות, תשלומים, bookings, ססיות, משימות, לידים, יומן, לוגים. כולל כתיבה. מוגן ב-`isAdminEmail`.

---

## פקודות

| פעולה             | פקודה           |
| ----------------- | --------------- |
| שרת פיתוח         | `npm run dev`   |
| Build לפרודקשן    | `npm run build` |
| הרצת build מקומית | `npm start`     |
| Lint              | `npm run lint`  |

- **אין test suite.** אין `npm test`. בדיקות ידניות בדפדפן (Playwright MCP) או דרך deployment ב-Vercel.
- **ספריית package**: `npm` (לא pnpm/yarn). Next.js **16** (Turbopack), React **19**, Tailwind **v4**.
- **סקריפטים חד-פעמיים** (`scripts/*.ts`, למשל migration) רצים עם Node native TS:
  `node --experimental-strip-types --env-file=.env.local scripts/<name>.ts`
- **TypeScript הוא ה-gate של הבנייה.** `next build` נכשל על שגיאת type. לבדיקה מהירה: `npx tsc --noEmit`.

### Deployment - חשוב

- **הפרויקט ב-Vercel וב-GitHub בחשבון של הילית** (`github.com/helit-haklika/portal-haklika`), לא של אורי. `git push` ל-`main` → Vercel בונה ופורס אוטומטית.
- ה-Vercel MCP מחובר לחשבון אחר ולא רואה את הפרויקט (404). **לאמת deploy אחרי push דרך `gh`:**
  `gh api repos/helit-haklika/portal-haklika/commits/<sha>/status --jq '.state'` → `pending`/`success`/`failure`. עקוב בלולאה עד שיוצא מ-pending. אל תניח הצלחה.
- **אזהרה**: ה-repo מכיל הרבה עבודה לא-committed (migration ל-Supabase, admin). `npm run build` מקומי בונה גם קבצים שלא ב-main → **עובר מקומית אבל נכשל ב-Vercel** אם דחפת קובץ שתלוי בקובץ לא-נדחף. כשדוחפים subset: ודא שכל ה-imports/types שהקוד הנדחף תלוי בהם כבר ב-main (או הרץ `tsc` על worktree נקי של main).

---

## סטאק

| שכבה             | טכנולוגיה                                                          |
| ---------------- | ------------------------------------------------------------------ |
| Framework        | Next.js 16 App Router + Turbopack (TypeScript)                     |
| Hosting          | Vercel (חשבון הילית)                                               |
| נתונים           | **Data source router**: Airtable או Supabase לפי `DATA_SOURCE`     |
| גישת API         | `fetch` ידני - אין SDK (לא `airtable`, לא `@supabase/supabase-js`) |
| Cache + Sessions | Upstash Redis (`@upstash/redis`)                                   |
| Email            | Make.com webhook (`MAKE_EMAIL_WEBHOOK_URL`) - לא Resend            |
| Auth             | Custom JWT (`jose`) + Magic Links (אין סיסמאות)                    |
| UI               | CSS custom properties (`.hk-*` classes) + Tailwind v4              |

---

## כללי אבטחה - חובה לשמור תמיד

1. **אין endpoint שמקבל `customer_id`/`supabaseId` מהדפדפן.** תמיד מגיע מה-JWT cookie בצד שרת.
2. **כל קריאת נתונים - Server Component / Server Action / route handler בלבד.** אף פעם לא מ-client component.
3. **מפתחות (`AIRTABLE_PAT`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`) לא חשופים לדפדפן.** `NEXT_PUBLIC_` אסור עליהם.
4. **Cache key תמיד כולל `customer_id`**: `customer:{id}:data` - מונע דליפה בין לקוחות.
5. **JWT**: httpOnly, Secure, SameSite=Strict, 30 יום. כולל `supabaseId` אופציונלי (cached אחרי login כדי לדלג על airtable_id→uuid lookup).
6. **Rate limiting** על `/api/auth/request-link`: מקסימום 5 בקשות ב-15 דקות לכל IP.
7. **Magic link token** - **קבוע (ללא תפוגה) ורב-פעמי**, מאוחסן ב-KV. **בכוונה** - החלטה מודעת לטובת UX (נתונים לא רגישים). דליפה מרוסנת ע"י **הגבלת מכשירים**: כל קישור עובד עד `MAX_DEVICES_PER_TOKEN` (=3) מכשירים שונים (לפי cookie `hk_device`), מכשיר נוסף נחסם. אל תחזיר את זה לחד-פעמי/תפוגה בלי לשאול.
8. **Login response** - לא חושף אם האימייל קיים ("אם האימייל קיים, שלחנו לינק").
9. **לקוח לא פעיל** (`סטטוס לקוח = 'לא פעיל'`) - חסום מכניסה. נאכף בשני מקומות: `request-link/route.ts` (לא נשלח לינק) **וגם** `verify/route.ts` (בדיקת `isActive` עם `fetchCustomer` לפני חתימת JWT - לינק קיים של לקוח שהושבת מפסיק לעבוד).
10. **CSP nonce-based** - נקבע פר-בקשה ב-`src/proxy.ts` (`script-src 'self' 'nonce-...' 'strict-dynamic'`, ללא `unsafe-inline` ל-scripts). שאר ה-security headers נשארו ב-`next.config.ts`. ה-root layout קורא `headers()` כדי לכפות רינדור דינמי - בלי זה דפים סטטיים לא מקבלים nonce ונשברים. אל תחזיר `unsafe-inline` ל-script-src.
11. **הגבלת מכשירים נכשלת-סגור**: אם KV לא זמין ב-`registerDevice`, הכניסה נדחית עם 503 (לא fail-open) + `logError`.

---

## ארכיטקטורה - החלטות שנעשו

### Data Source Router (הליבה)

`src/lib/data/index.ts` הוא נקודת הכניסה היחידה לנתונים. הוא בוחר מקור לפי `DATA_SOURCE` (ברירת מחדל `airtable`, `supabase` למעבר):

- `src/lib/airtable/` - קריאות PostgREST-style ל-Airtable (`fetch` + `filterByFormula`).
- `src/lib/supabase/` - קריאות ל-Supabase REST (PostgREST) דרך view `customer_dashboard` ועוד.
- שני המקורות חושפים **אותו interface ואותם types**. ה-`id` תמיד נשמר כ-legacy Airtable rec id (`airtable_id` ב-Supabase) כדי שה-JWT ימשיך לעבוד בין מקורות.
- קוד אפליקטיבי (dashboard, admin, auth) מייבא תמיד מ-`@/lib/data` - לעולם לא מ-`airtable`/`supabase` ישירות.

### Auth Flow

1. לקוח מזין אימייל - `/api/auth/request-link`
2. שרת מחפש דרך `findCustomerByEmail` (שדות `אימייל` + `אימייל נוסף`); rate-limit לפני הכל
3. אם קיים: `createMagicToken` (KV, ללא תפוגה), שולח את הלינק ל-**Make webhook** (`MAKE_EMAIL_WEBHOOK_URL`) שמרנדר ושולח את המייל. תמיד מחזיר 200 (לא חושף קיום)
4. לקוח לוחץ - `GET /api/auth/verify` → redirect ל-`/auth/verify` (client) → `POST /api/auth/verify`: `readMagicToken` (לא מוחק), `registerDevice` (gate 3 מכשירים), `signJWT`, שותל cookie `hk_session` + `hk_device`
5. מפנה ל-`/dashboard` (או `/admin` לאדמין ללא רשומת לקוח)

`/api/dev/login?email=` - backdoor כניסה ל-development בלבד (404 בפרודקשן), עוקף את כל ה-magic link.

### Data Fetching (דשבורד)

5-6 קריאות מקבילות דרך `@/lib/data`, cached 60 שניות. Cache key: `customer:{id}:data`, invalidation רק ב-TTL. נתונים מ-1/1/25 ואילך בלבד.

### הצגה מותנית

מסתמכים על **קיום נתונים בפועל**, לא על שדה `סוג תשלומים`:

```typescript
const hasPunchCardData = punchCardPayments.length > 0 || bookings.length > 0;
const hasSessionData = activeSessions.length > 0;
```

---

## מבנה תיקיות (עיקרי)

```
src/
├── app/
│   ├── (auth)/         login, auth/verify, auth/check-email
│   ├── (dashboard)/    dashboard - הפורטל ללקוח
│   ├── (admin)/        admin/{customers,payments,bookings,sessions,tasks,leads,calendar,logs}
│   ├── api/
│   │   ├── auth/       request-link, verify, logout
│   │   └── dev/        login (dev only)
│   ├── globals.css     רק @import-ים (פוצל לפי surface)
│   └── styles/         tokens, dashboard, auth, shared, admin (.hk-* classes)
├── components/
│   ├── dashboard/      Header, KpiCards, PurchaseSection, BookingsSection, ...
│   ├── shared/         Icons, ExportButton, ShowMoreButton, EmptyState, ...
│   └── ui/             shadcn - אל תגע
├── lib/
│   ├── data/           ★ router בין airtable ל-supabase (נקודת כניסה יחידה)
│   ├── airtable/       client + queries (fetch ידני)
│   ├── supabase/       client + queries (PostgREST, view-based)
│   ├── auth/           jwt, magic-link, session, admin
│   ├── admin/          queries לאדמין, מפוצל לפי דומיין (customers, payments, bookings, sessions, kpis, leads, tasks + index)
│   ├── balance/        חישוב יתרה
│   ├── cache/          kv (Upstash wrapper)
│   └── logs/           audit logs
├── scripts/            migration scripts (node --experimental-strip-types)
├── supabase/migrations/
└── middleware.ts
```

---

## מערכת העיצוב - CSS classes

כל ה-UI בנוי על `.hk-*` classes ב-`src/app/styles/` (מיובאים דרך `globals.css`): `tokens.css`, `dashboard.css`, `auth.css`, `shared.css`, `admin.css`. Tailwind רק לדברים שאין להם `.hk-*`.

### CSS tokens ראשיים

```css
--bg: #f5f1ea /* רקע אפליקציה */ --surface: #ffffff /* כרטיסים */
  --primary: #2f5d54 /* ירוק כהה - ראשי */ --danger: #b84a3e
  /* אדום - יתרה שלילית */ --ink: #1b2230 /* טקסט ראשי */ --ink-muted: #6b7280
  /* טקסט משני */;
```

### קומפוננטות עיקריות

| Class             | תיאור                                                   |
| ----------------- | ------------------------------------------------------- |
| `.hk-header`      | Header דביק עם blur                                     |
| `.hk-kpi--hero`   | KPI ראשי (ירוק, רוחב מלא)                               |
| `.hk-kpi--danger` | KPI יתרה במינוס (אדום)                                  |
| `.hk-list`        | כרטיס רשימה                                             |
| `.hk-table`       | טבלה (דסקטופ); `.hk-table--stack` הופך לכרטיסים במובייל |
| `.hk-fab`         | WhatsApp FAB צף                                         |
| `.hk-num`         | מספרים tabular                                          |

**טבלאות במובייל**: כל טבלת פורטל היא `.hk-table--stack` עם `data-label` על כל `<td>`. מתחת ל-640px השורות הופכות לכרטיסים (כל שדה בשורה עם תווית) - לא גלילה אופקית. טבלאות אדמין עדיין עם גלילה אופקית.

---

## הנחיות עיצוב - RTL ו-Mobile-first

- **RTL מלא**: `dir="rtl"` על `<html>`, `lang="he"`
- **Mobile-first**: single column, padding 16px
- **גופן**: Heebo (Google Fonts), weights 300-800
- **feature-settings**: `'tnum' 1, 'ss01' 1` (מספרים יציבי-רוחב)
- **Touch targets**: מינימום 44x44px, מרווח 8px
- **FAB**: 56x56px, bottom: 44px, left: 16px (RTL)
- **Email input**: direction: ltr, text-align: right

---

## Environment Variables

```bash
# מקור נתונים
DATA_SOURCE=               # 'airtable' (default) | 'supabase'

# Airtable
AIRTABLE_PAT=              # PAT, scope: data.records:read
AIRTABLE_BASE_ID=          # appXXXX

# Supabase (כש-DATA_SOURCE=supabase)
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY= # server-only, לא NEXT_PUBLIC

# Auth
JWT_SECRET=                # 64+ chars random
COOKIE_DOMAIN=             # production only

# Email (Make webhook - לא Resend)
MAKE_EMAIL_WEBHOOK_URL=    # Make scenario שמרנדר ושולח את מייל הכניסה

# Upstash Redis (KV)
KV_REST_API_URL=
KV_REST_API_TOKEN=

# App
NEXT_PUBLIC_APP_URL=https://portal.haklika.co.il
PUNCH_CARD_PURCHASE_LINKS=  # JSON: [{"label":"10 שעות","url":"..."}]
HAKLIKA_WHATSAPP_NUMBER=    # פורמט בינלאומי ללא + או 0
HAKLIKA_BUSINESS_NAME=הקליקה
```

> תבנית מייל הכניסה חיה ב-Make (לא בקוד) - שינוי טקסט תוקף/הוראות נעשה שם.

---

## מה לא בסקופ (פורטל הלקוח)

- עריכת נתונים מצד הלקוח (אדמין כן כותב)
- real-time updates · הזמנת חדר · גרפים · מספר שפות
- היסטוריה לפני 1/1/25
