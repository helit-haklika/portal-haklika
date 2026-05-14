# פורטל הקליקה — הנחיות לקלוד קוד

## סקירה

פורטל קריאה בלבד ל-177 לקוחות של הקליקה (השכרת חדרים בקליניקות).
כל לקוח רואה רק את הנתונים שלו: יתרת שעות, היסטוריית רכישות, bookings, ססיות פעילות, תשלומים.

---

## סטאק

| שכבה             | טכנולוגיה                                                     |
| ---------------- | ------------------------------------------------------------- |
| Framework        | Next.js 14 App Router (TypeScript)                            |
| Hosting          | Vercel (Hobby בפיתוח, Pro לפני rollout)                       |
| Source Control   | GitHub private repo                                           |
| נתונים           | Airtable Bizible base - קריאה בלבד                            |
| Cache + Sessions | Vercel KV (Upstash Redis)                                     |
| Email            | Resend                                                        |
| UI               | CSS custom properties (.hk-\* classes) + shadcn/ui + Tailwind |
| Auth             | Custom JWT + Magic Links (אין סיסמאות)                        |

---

## כללי אבטחה - חובה לשמור תמיד

1. **אין endpoint שמקבל `customer_id` מהדפדפן.** ה-`customer_id` תמיד מגיע מה-JWT cookie בצד שרת.
2. **כל קריאה ל-Airtable - Server Component או Server Action בלבד.** אף פעם לא מ-client component.
3. **AIRTABLE_PAT אף פעם לא חשוף לדפדפן.** מוגדר ב-Vercel env vars, `NEXT_PUBLIC_` אסור.
4. **Cache key תמיד כולל `customer_id`**: `customer:{id}:data` - מונע דליפה בין לקוחות.
5. **JWT**: httpOnly, Secure, SameSite=Strict, 30 יום.
6. **Rate limiting** על `/api/auth/request-link`: מקסימום 5 בקשות ב-15 דקות לכל IP.
7. **Magic link token** - חד-פעמי, TTL 15 דקות, מאוחסן ב-KV, נמחק מיד אחרי שימוש.
8. **Login response** - לא חושף אם האימייל קיים ("אם האימייל קיים, שלחנו לינק").
9. **לקוח לא פעיל** (`סטטוס לקוח = 'לא פעיל'`) - חסום מכניסה.
10. **CSP headers** ב-`next.config.ts` - לחסום inline scripts זרים.

---

## ארכיטקטורה - החלטות שנעשו

### Auth Flow

1. לקוח מזין אימייל - `/api/auth/request-link`
2. שרת בודק קיום ב-Airtable (שדות `אימייל` + `אימייל נוסף`)
3. אם קיים: יוצר token, שומר ב-KV (TTL 15min), שולח מייל עם Resend
4. לקוח לוחץ - `/auth/verify?token=xyz` - שרת מאמת, מוחק token, יוצר JWT cookie
5. מפנה ל-`/dashboard`

### Data Fetching

5 קריאות מקבילות ל-Airtable בכניסה לדשבורד, cached 60 שניות:

- Call 1: פרטי לקוח (`לקוחות` tblIUoXFMdWuFldvr)
- Call 2: תשלומי כרטיסיות (`תשלומים` tblfGq7ezJ45irjed, סוג='כרטיסיה', סטטוס='שולם')
- Call 3: שימושים/bookings (`שימושים` tblZKbBcLserEDH9D, סוג='שעתי')
- Call 4: ססיות פעילות (`ססיות` tblp3BzSRFpcqVsXR, סטטוס='פעיל')
- Call 5: עסקאות ססיה + תשלומי ססיה (`עסקאות ססיה` tbltJwGoN4OUtKaHq + `תשלומים`)

Cache key: `customer:{customer_id}:data`, TTL 60s, invalidation רק ב-TTL.

### הצגה מותנית

```typescript
const hasPunchCardData = punchCardPayments.length > 0 || bookings.length > 0;
const hasSessionData = activeSessions.length > 0;
```

לא מסתמכים על שדה `סוג תשלומים` - מסתמכים על קיום נתונים בפועל.

---

## מבנה תיקיות

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── auth/
│   │   │   ├── verify/page.tsx
│   │   │   └── check-email/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── request-link/route.ts
│   │   │   └── logout/route.ts
│   │   └── export/
│   │       └── pdf/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx           (redirect לפי auth)
├── components/
│   ├── dashboard/
│   │   ├── Header.tsx
│   │   ├── KpiCards.tsx
│   │   ├── PurchaseSection.tsx
│   │   ├── BookingsSection.tsx
│   │   ├── ActiveSessionsSection.tsx
│   │   ├── SessionPaymentsSection.tsx
│   │   ├── RecurringPaymentSummary.tsx
│   │   ├── Footer.tsx
│   │   └── WhatsAppFab.tsx
│   ├── shared/
│   │   ├── Icons.tsx
│   │   ├── ExportButton.tsx
│   │   ├── EmptyState.tsx
│   │   └── LoadingSkeleton.tsx
│   └── ui/                (shadcn - אל תגע)
├── lib/
│   ├── airtable/
│   │   ├── client.ts      (Airtable API wrapper)
│   │   ├── queries.ts     (5 פונקציות שליפה)
│   │   └── types.ts       (TypeScript types)
│   ├── auth/
│   │   ├── jwt.ts         (sign/verify JWT)
│   │   ├── magic-link.ts  (generate/verify token)
│   │   └── session.ts     (getCurrentCustomer)
│   ├── cache/
│   │   └── kv.ts          (Vercel KV wrapper)
│   └── export/
│       ├── csv.ts
│       └── pdf.ts
├── middleware.ts
└── types/
    └── index.ts
```

---

## מערכת העיצוב - CSS classes

כל ה-UI בנוי על `.hk-*` classes המוגדרים ב-`src/app/globals.css`.
Tailwind משמש רק לדברים שאין להם `.hk-*` class.

### CSS tokens ראשיים

```css
--bg: #f5f1ea /* רקע אפליקציה */ --surface: #ffffff /* כרטיסים */
  --primary: #2f5d54 /* ירוק כהה - ראשי */ --danger: #b84a3e
  /* אדום - יתרה שלילית */ --ink: #1b2230 /* טקסט ראשי */ --ink-muted: #6b7280
  /* טקסט משני */;
```

### קומפוננטות עיקריות

| Class             | תיאור                     |
| ----------------- | ------------------------- |
| `.hk-header`      | Header דביק עם blur       |
| `.hk-kpi--hero`   | KPI ראשי (ירוק, רוחב מלא) |
| `.hk-kpi--danger` | KPI יתרה במינוס (אדום)    |
| `.hk-list`        | כרטיס רשימה (במקום טבלה)  |
| `.hk-row`         | שורה ברשימה               |
| `.hk-fab`         | WhatsApp FAB צף           |
| `.hk-skel`        | Skeleton loading          |
| `.hk-num`         | מספרים tabular            |

---

## הנחיות עיצוב - RTL ו-Mobile-first

- **RTL מלא**: `dir="rtl"` על `<html>`, `lang="he"`
- **Mobile-first**: single column, padding 16px
- **גופן**: Heebo (Google Fonts), weights 300/400/500/600/700/800
- **feature-settings**: `'tnum' 1, 'ss01' 1` (מספרים יציבי-רוחב)
- **Touch targets**: מינימום 44x44px, מרווח 8px בין elements
- **Header**: sticky, backdrop-filter blur(14px)
- **FAB**: 56x56px, bottom: 44px, left: 16px (RTL), z-index: 30
- **Email input**: direction: ltr, text-align: right

---

## Environment Variables

```bash
# Airtable
AIRTABLE_PAT=              # PAT, scope: data.records:read בלבד
AIRTABLE_BASE_ID=          # appXXXX

# Auth
JWT_SECRET=                # 64+ chars random
COOKIE_DOMAIN=             # production only

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=login@haklika.co.il
RESEND_FROM_NAME=הקליקה

# Vercel KV (מתווסף אוטומטית)
KV_REST_API_URL=
KV_REST_API_TOKEN=

# App
NEXT_PUBLIC_APP_URL=https://portal.haklika.co.il
PUNCH_CARD_PURCHASE_LINKS=  # JSON: [{"label":"10 שעות","url":"..."}]
HAKLIKA_WHATSAPP_NUMBER=    # פורמט בינלאומי ללא + או 0
HAKLIKA_BUSINESS_NAME=הקליקה
```

---

## מה לא בסקופ (גרסה 1)

- עריכת נתונים מצד הלקוח
- real-time updates
- הזמנת חדר מהפורטל
- גרפים / ויזואליזציות
- היסטוריה לפני 1/1/25
- מספר שפות
- גרסת Desktop (בשלב הזה)
