# 📋 הקליקה - Make Scenarios Audit

**Date**: 2026-05-25 | **Total scenarios**: 60 | **Active**: 34

## סקירת תיקיות

- **לידים**: 7 scenarios (6 active)
- **תפעול שוטף**: 18 scenarios (13 active)
- **קליטת לקוחות**: 7 scenarios (7 active)
- **(ללא folder)**: 28 scenarios (8 active)

---

## 📁 לידים

### 🟢 `4900547` ביצירת ליד חדש- מכין לינק מקוצר לאינטרפייס ⚠️ DLQ:1

- **Modules**: 3 | **Trigger**: immediately
- **Apps**: gateway(1), http(1), airtable(1)

### 🟢 `3159155` כל הטספים בקמפיין - נשמר באירטייבל - נשלחת הודעה

- **Modules**: 36 | **Trigger**: immediately
- **Apps**: util(17), builtin(8), http(3), app#greenapi-nuycxg(3), airtable(2), facebook-lead-ads(1)

### 🟢 `4752228` כל הטספים בקמפיין - נשמר באירטייבל - נשלחת הודעה חשבון עומרי פוקס ⚠️ DLQ:4

- **Modules**: 50 | **Trigger**: immediately
- **Apps**: util(28), builtin(9), airtable(4), http(3), app#greenapi-nuycxg(3), facebook-lead-ads(1)

### 🟢 `4900486` כל יום ב8 וב14, שולח הודעה עם כל הלידים הפתוחים במערכת לקבוצת הקליקה

- **Modules**: 4 | **Trigger**: immediately
- **Apps**: gateway(1), airtable(1), util(1), app#greenapi-nuycxg(1)

### 🟢 `4023526` לידים מבוט מאניצ׳ט

- **Modules**: 30 | **Trigger**: immediately
- **Apps**: util(17), builtin(5), http(3), airtable(2), gateway(1), app#testing-g3yhep(1)

### 🟢 `3406507` נשלח טופס קביעת פגישה - נשלחת הודעה ללקוח

- **Modules**: 20 | **Trigger**: immediately
- **Apps**: util(6), builtin(5), airtable(3), fillout(1), google-calendar(1), app#testing-g3yhep(1)

### ⚪ `4900633` פולאו אפ אחרי פגישה

- **Modules**: 2 | **Trigger**: indefinitely
- **Apps**: app#shay-toolbox-l0v44z(1), airtable(1)

## 📁 תפעול שוטף

### 🟢 `4943229` דפי תשלום grow ⚠️ DLQ:18

- **Modules**: 30 | **Trigger**: immediately
- **Apps**: util(9), builtin(8), app#my-app-b90mkx(8), placeholder(2), gateway(1), scenario-service(1)

### 🟢 `3053279` וובהוק מגרין - הקליקה

- **Modules**: 4 | **Trigger**: immediately
- **Apps**: app#greenapi-nuycxg(1), builtin(1), phonenumber(1), http(1)

### 🟢 `3776487` כל בוקר, מדליק סנריו

- **Modules**: 3 | **Trigger**: weekly
- **Apps**: make(2), app#shay-toolbox-l0v44z(1)

### 🟢 `4934319` כל בוקר, מעדכן בקבוצה כמה רשומות בוקינג עלו הלילה

- **Modules**: 5 | **Trigger**: indefinitely
- **Apps**: app#greenapi-nuycxg(2), airtable(1), util(1), builtin(1)

### 🟢 `3776496` כל ערב - מכבה סנריו הודעות

- **Modules**: 2 | **Trigger**: weekly
- **Apps**: make(2)

### 🟢 `3416793` לאחר עיבוד דוח סקדה - מעדכן לקוחות בייצרה נמוכה/מינוס

- **Modules**: 25 | **Trigger**: on-demand
- **Apps**: builtin(8), airtable(5), util(4), app#testing-g3yhep(2), phonenumber(2), http(2)

### 🟢 `3055398` מסמכים חשבונית ירוקה

- **Modules**: 55 | **Trigger**: immediately
- **Apps**: builtin(17), airtable(16), util(14), regexp(2), phonenumber(2), http(2)

### 🟢 `3832156` סטטוס לקוח משנה - מוחק תשלומים עתדייים

- **Modules**: 3 | **Trigger**: immediately
- **Apps**: airtable(2), gateway(1)

### 🟢 `3775286` סנריו שליחת הודעות וואטסאפ (כבוי בשבתות וחגים)

- **Modules**: 18 | **Trigger**: immediately
- **Apps**: builtin(9), app#greenapi-nuycxg(6), util(2), gateway(1)

### 🟢 `4419061` סנריו שליחת הודעות וואטסאפ (פתוח כל הזמן)

- **Modules**: 11 | **Trigger**: immediately
- **Apps**: builtin(5), app#greenapi-nuycxg(3), util(2), gateway(1)

### 🟢 `3715860` פולאו אפ - אישור הוראת קבע

- **Modules**: 14 | **Trigger**: weekly
- **Apps**: builtin(4), airtable(3), http(2), app#greenapi-nuycxg(2), app#shay-toolbox-l0v44z(1), phonenumber(1)

### 🟢 `4104167` פעם בשבוע, מוחק רשומות ישנות

- **Modules**: 2 | **Trigger**: weekly
- **Apps**: google-drive(2)

### 🟢 `3776507` שישי ערב - מכבה סנריו הודעות

- **Modules**: 4 | **Trigger**: weekly
- **Apps**: make(2), builtin(2)

### ⚪ `3041125` דוח חודשי

- **Modules**: 16 | **Trigger**: monthly
- **Apps**: builtin(5), util(2), airtable(2), datastore(2), app#shay-toolbox-l0v44z(1), phonenumber(1)

### ⚪ `4729175` הוראות קבע grow

- **Modules**: 12 | **Trigger**: immediately
- **Apps**: builtin(4), app#my-app-b90mkx(3), util(3), gateway(1), placeholder(1)

### ⚪ `2924065` עיבוד דוח שבועי מסקדה

- **Modules**: 77 | **Trigger**: immediately
- **Apps**: builtin(35), airtable(26), util(8), gateway(2), scenario-service(1), http(1)

### ⚪ `4015033` תשלומים חשבונית ירוקה

- **Modules**: 59 | **Trigger**: immediately
- **Apps**: builtin(20), airtable(17), util(13), phonenumber(2), http(2), app#greenapi-nuycxg(2)

### ⚪ `4729172` תשלומים רגילים grow

- **Modules**: 13 | **Trigger**: immediately
- **Apps**: app#my-app-b90mkx(4), builtin(4), util(3), gateway(1), placeholder(1)

## 📁 קליטת לקוחות

### 🟢 `3527027` וובהוק יציר טופס חוזה

- **Modules**: 17 | **Trigger**: immediately
- **Apps**: builtin(8), airtable(4), util(3), gateway(2)

### 🟢 `3530643` חוזה חתום - מעדכן באירטייבל, שולח הודעה ללקוח

- **Modules**: 37 | **Trigger**: immediately
- **Apps**: builtin(13), airtable(6), util(6), http(4), fillfaster(2), app#my-app-b90mkx(2)

### 🟢 `3527031` טופס הכנת חוזה מתקבל - מכין חוזה ושולח ללקוח

- **Modules**: 31 | **Trigger**: immediately
- **Apps**: util(9), airtable(8), builtin(8), gateway(1), fillfaster(1), phonenumber(1)

### 🟢 `4211964` טופס עדכון לקוח קיים

- **Modules**: 17 | **Trigger**: immediately
- **Apps**: builtin(5), airtable(4), util(2), http(2), app#greenapi-nuycxg(2), fillout(1)

### 🟢 `3510140` טופס קליטת לקוח חדש - מעדכן באירטייבל

- **Modules**: 18 | **Trigger**: immediately
- **Apps**: builtin(6), airtable(3), util(3), http(2), app#greenapi-nuycxg(2), fillout(1)

### 🟢 `3574752` עדכונים ממורניגנ

- **Modules**: 39 | **Trigger**: indefinitely
- **Apps**: builtin(12), util(7), airtable(5), regexp(3), app#my-app-b90mkx(3), app#greenapi-nuycxg(3)

### 🟢 `3546284` שליחת טופס השלמת פרטים ללקוח חדש

- **Modules**: 10 | **Trigger**: immediately
- **Apps**: builtin(3), airtable(2), gateway(1), phonenumber(1), app#testing-g3yhep(1), http(1)

## 📁 (ללא folder)

### 🟢 `4234755` HAKLIKA TALK טפסים

- **Modules**: 22 | **Trigger**: immediately
- **Apps**: builtin(8), manychat(4), http(3), util(3), airtable(2), fillout(1)

### 🟢 `4901079` הודעות מתוזמנות - תיעוד שיחות ⚠️ DLQ:1

- **Modules**: 13 | **Trigger**: immediately
- **Apps**: builtin(4), http(3), app#greenapi-nuycxg(2), gateway(1), airtable(1), phonenumber(1)

### 🟢 `4017983` וובהוק מbrowser flow - מעלה לדרייב ומוריד גוגל שיטס

- **Modules**: 53 | **Trigger**: immediately
- **Apps**: builtin(24), airtable(18), util(6), google-drive(2), gateway(1), regexp(1)

### 🟢 `4236872` טופס וויקס - נכנס לאירטייבל

- **Modules**: 31 | **Trigger**: immediately
- **Apps**: util(18), builtin(5), http(3), airtable(2), gateway(1), app#testing-g3yhep(1)

### 🟢 `4035598` טופס פילאאוט מתעניינים

- **Modules**: 30 | **Trigger**: immediately
- **Apps**: util(17), builtin(5), http(3), airtable(2), fillout(1), app#testing-g3yhep(1)

### 🟢 `5096782` מתבל וובהוק מפורטל - בקשה התבחרות - שולח לינק ללקוח ⚠️ DLQ:1

- **Modules**: 2 | **Trigger**: immediately
- **Apps**: gateway(1), microsoft-email(1)

### 🟢 `3520754` שליחת הודעות מותאמות ⚠️ DLQ:5

- **Modules**: 17 | **Trigger**: immediately
- **Apps**: builtin(5), http(3), gateway(2), airtable(2), app#greenapi-nuycxg(2), phonenumber(1)

### 🟢 `3663355` שליחת טופס עדכוני לקוח

- **Modules**: 13 | **Trigger**: immediately
- **Apps**: builtin(4), gateway(2), airtable(2), phonenumber(1), app#testing-g3yhep(1), http(1)

### ⚪ `3056345` Integration Airtable

- **Modules**: 3 | **Trigger**: indefinitely
- **Apps**: airtable(2), app#my-app-b90mkx(1)

### ⚪ `3530815` Integration Airtable, Morning

- **Modules**: 3 | **Trigger**: indefinitely
- **Apps**: airtable(2), app#my-app-b90mkx(1)

### ⚪ `3514635` Integration Fillout Forms, Airtable, FillFaster

- **Modules**: 3 | **Trigger**: immediately
- **Apps**: fillout(1), airtable(1), fillfaster(1)

### ⚪ `3778347` Integration Green API

- **Modules**: 1 | **Trigger**: indefinitely
- **Apps**: app#greenapi-nuycxg(1)

### ⚪ `4755896` Integration Grow

- **Modules**: 3 | **Trigger**: immediately
- **Apps**: grow(2), gateway(1)

### ⚪ `3926248` Integration HTTP

- **Modules**: 2 | **Trigger**: indefinitely
- **Apps**: http(1), onedrive(1)

### ⚪ `4212023` Integration HTTP

- **Modules**: 4 | **Trigger**: indefinitely
- **Apps**: http(1), builtin(1), util(1), airtable(1)

### ⚪ `5178275` Integration HTTP

- **Modules**: 5 | **Trigger**: indefinitely
- **Apps**: builtin(2), http(1), util(1), airtable(1)

### ⚪ `3576321` Integration Microsoft 365 Excel, Microsoft 365 Email (Outlook), OneDrive, Microsoft Word Templates, Google Docs

- **Modules**: 8 | **Trigger**: indefinitely
- **Apps**: microsoft-excel(2), microsoft-email(2), onedrive(2), docx-templater(1), google-docs(1)

### ⚪ `3015002` Integration Morning

- **Modules**: 50 | **Trigger**: immediately
- **Apps**: builtin(20), util(14), airtable(13), app#my-app-b90mkx(1), regexp(1), phonenumber(1)

### ⚪ `3104282` Integration Morning

- **Modules**: 1 | **Trigger**: indefinitely
- **Apps**: app#my-app-b90mkx(1)

### ⚪ `3158975` Integration Morning

- **Modules**: 2 | **Trigger**: immediately
- **Apps**: app#my-app-b90mkx(1), gateway(1)

### ⚪ `3402402` Integration Morning

- **Modules**: 2 | **Trigger**: indefinitely
- **Apps**: app#my-app-b90mkx(2)

### ⚪ `3812833` Integration Tools

- **Modules**: 1 | **Trigger**: indefinitely
- **Apps**: util(1)

### ⚪ `3159160` טופס לידים

- **Modules**: 3 | **Trigger**: immediately
- **Apps**: facebook-lead-ads(2), airtable(1)

### ⚪ `2986498` יבוא תשלומיי עבר

- **Modules**: 30 | **Trigger**: indefinitely
- **Apps**: util(11), airtable(11), builtin(6), google-sheets(1), regexp(1)

### ⚪ `3238004` לידים מעודכן 19/6

- **Modules**: 4 | **Trigger**: immediately
- **Apps**: facebook-lead-ads(2), airtable(2)

### ⚪ `3712089` מיילים עדכונים מסקדה

- **Modules**: 21 | **Trigger**: indefinitely
- **Apps**: builtin(5), util(4), regexp(3), airtable(3), placeholder(3), ai-tools(2)

### ⚪ `3988735` קובץ מסקדה בדרייב

- **Modules**: 8 | **Trigger**: indefinitely
- **Apps**: google-drive(4), util(3), google-sheets(1)

### ⚪ `2835671` תשלומים מורנינג הקליקה

- **Modules**: 36 | **Trigger**: immediately
- **Apps**: builtin(14), util(9), airtable(9), app#my-app-b90mkx(2), regexp(1), phonenumber(1)
