export interface AirtableRecord<T> {
  id: string;
  fields: T;
  createdTime: string;
}

export interface CustomerFields {
  "שם לקוח"?: string;
  אימייל?: string;
  "אימייל נוסף"?: string;
  "ייתרה לפי חישוב"?: number;
  "סטטוס לקוח"?: string;
  "טופס עדכון פרטי לקוח"?: string;
}

export interface PunchCardPaymentFields {
  לקוח?: string[];
  "סוג תשלום"?: string;
  סטטוס?: string;
  "תאריך תשלום"?: string;
  "שעות כרטיסיה שנרכשו"?: number;
  "סכום שולם"?: number;
  "קישור לחשבונית"?: string;
}

export interface BookingFields {
  לקוח?: string[];
  "Booking Title"?: string;
  תאריך?: string;
  "שם חדר (from חדר)"?: string[];
  "שעת התחלה מפורמט"?: string;
  "שעת סיום מפורמט"?: string;
  "משך בשעות"?: number;
  "ייתרת שעות לאחר שימוש"?: number;
  "בחודש הנוכחי?"?: boolean;
}

export interface SessionFields {
  לקוח?: string[];
  "סטטוס ססיה"?: string;
  יום?: string;
  "שעת התחלה"?: string;
  "שעת סיום"?: string;
  "מחיר לפני הנחה"?: number;
  חדר?: string[];
}

export interface SessionTransactionFields {
  לקוח?: string[];
  "סטטוס עסקה"?: string;
  "מחיר אחרי הנחה"?: number;
}

export interface SessionPaymentFields {
  לקוח?: string[];
  "סוג תשלום"?: string;
  סטטוס?: string;
  "תאריך תשלום"?: string;
  "סכום שולם"?: number;
  "קישור לחשבונית"?: string;
}
