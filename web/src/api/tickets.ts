import apiClient from './client';
import type { TicketType, Ticket, AbonadoEntry } from '../types';

export const getTicketTypesByEvent = async (eventId: number): Promise<TicketType[]> => {
  const response = await apiClient.get<TicketType[]>(`/api/events/${eventId}/ticket-types`);
  return response.data;
};

export const getSeasonPassTypesByEvent = async (eventId: number): Promise<TicketType[]> => {
  const response = await apiClient.get<TicketType[]>(`/api/events/${eventId}/ticket-types`);
  return response.data.filter((tt) => tt.isSeasonPass);
};

export interface SellTicketPayload {
  ticketTypeId: number;
  holderName: string;
  holderEmail: string;
}

export const sellTicket = async (payload: SellTicketPayload): Promise<Ticket> => {
  const response = await apiClient.post<Ticket>('/api/tickets', payload);
  return response.data;
};

// Returns raw PNG bytes as a Blob for QR code display/download
export const getTicketQrBlob = async (ticketId: number): Promise<Blob> => {
  const response = await apiClient.get(`/api/tickets/${ticketId}/qr`, {
    responseType: 'blob',
  });
  return response.data as Blob;
};

export interface CreateTicketTypePayload {
  name: string;
  price: number;
  isSeasonPass: boolean;
  quota: number;
}

export const createTicketType = async (
  eventId: number,
  payload: CreateTicketTypePayload
): Promise<TicketType> => {
  const response = await apiClient.post<TicketType>(
    `/api/events/${eventId}/ticket-types`,
    payload
  );
  return response.data;
};

export const getAbonados = async (eventId: number): Promise<AbonadoEntry[]> => {
  const response = await apiClient.get<AbonadoEntry[]>(`/api/tickets/abonados?eventId=${eventId}`);
  return response.data;
};

export const invalidateTicket = async (ticketId: number): Promise<Ticket> => {
  const response = await apiClient.put<Ticket>(`/api/tickets/${ticketId}/invalidate`);
  return response.data;
};

