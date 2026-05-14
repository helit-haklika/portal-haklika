export interface Customer {
  id: string;
  name: string;
  email: string;
  additionalEmail?: string;
  balance: number;
  isActive: boolean;
  updateFormUrl?: string;
}

export interface PunchCardPayment {
  id: string;
  date: string;
  dayOfWeek: string;
  hours: number;
  amountPaid: string;
  invoiceUrl?: string;
}

export interface Booking {
  id: string;
  date: string;
  dayOfWeek: string;
  roomName: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  balanceAfter: number;
  isCurrentMonth: boolean;
}

export interface ActiveSession {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  basePriceBeforeDiscount: string;
  roomName: string;
}

export interface SessionTransaction {
  id: string;
  priceAfterDiscount: number;
}

export interface SessionPayment {
  id: string;
  date: string;
  dayOfWeek: string;
  amountPaid: string;
  invoiceUrl?: string;
}

export interface DashboardData {
  customer: Customer;
  punchCardPayments: PunchCardPayment[];
  bookings: Booking[];
  activeSessions: ActiveSession[];
  sessionTransactions: SessionTransaction[];
  sessionPayments: SessionPayment[];
}

export interface JWTPayload {
  customerId: string;
  email: string;
  exp: number;
}
