export interface ClubProfile {
  id: number;
  teamName: string;
  venue: string;
  capacity: number;
  abonoBackgroundUrl: string | null;
}

export interface TicketTypeTemplate {
  id: number;
  name: string;
  price: number;
}

export interface Event {
  id: number;
  name: string;
  date: string; // ISO LocalDateTime string from Spring Boot
  venue: string;
  capacity: number;
  active: boolean;
  seasonPassEnabled: boolean;
  entradaBackgroundUrl: string | null;
}

export interface EventStats {
  totalTickets: number;
  scanned: number;
  remaining: number;
  seasonPassesScannedToday: number;
}

export interface TicketType {
  id: number;
  name: string;
  price: number; // BigDecimal serializes as number in JSON
  isSeasonPass: boolean;
  quota: number;
}

export interface Ticket {
  id: number;
  qrCode: string;
  holderName: string;
  holderEmail: string;
  purchasedAt: string; // ISO LocalDateTime
  isValid: boolean;
  ticketTypeName: string;
  price: number;
  isSeasonPass: boolean;
  eventName: string;
  eventId: number;
}

export interface AbonoType {
  id: number;
  name: string;
  price: number;
  active: boolean;
}

export interface AbonadoEntry {
  id: number;
  numero: number;
  holderName: string;
  holderEmail: string;
  qrCode: string;
  active: boolean;
  createdAt: string; // ISO LocalDateTime
  abonoTypeName: string;
  abonoTypePrice: number;
}

export interface AccessLog {
  id: number;
  scannedAt: string; // ISO LocalDateTime
  deviceId: string;
  holderName: string;
  holderEmail: string;
  ticketTypeName: string;
  isSeasonPass: boolean;
  eventId: number;
}

export interface SpringPage<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export type AccessStats = EventStats;
