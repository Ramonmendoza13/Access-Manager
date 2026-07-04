import apiClient from './client';
import type { Event, EventStats } from '../types';

export const getEvents = async (): Promise<Event[]> => {
  const response = await apiClient.get<Event[]>('/api/events');
  return response.data;
};

export const getActiveEvent = async (): Promise<Event> => {
  const response = await apiClient.get<Event>('/api/events/active');
  return response.data;
};

export const activateEvent = async (id: number): Promise<Event> => {
  const response = await apiClient.put<Event>(`/api/events/${id}/activate`);
  return response.data;
};

export const deactivateEvent = async (id: number): Promise<Event> => {
  const response = await apiClient.put<Event>(`/api/events/${id}/deactivate`);
  return response.data;
};

export interface CreateEventPayload {
  name: string;
  date: string; // ISO datetime string: YYYY-MM-DDTHH:MM
  venue: string;
  capacity: number;
}

export const createEvent = async (payload: CreateEventPayload): Promise<Event> => {
  const response = await apiClient.post<Event>('/api/events', payload);
  return response.data;
};

export const getEventStats = async (eventId: number): Promise<EventStats> => {
  const response = await apiClient.get<EventStats>(`/api/access/stats/${eventId}`);
  return response.data;
};

export const toggleSeasonPass = async (eventId: number, enabled: boolean): Promise<Event> => {
  const response = await apiClient.put<Event>(`/api/events/${eventId}/season-pass?enabled=${enabled}`);
  return response.data;
};

export interface UpdateEventPayload {
  name: string;
  date: string;
  venue: string;
  capacity: number;
}

export const updateEvent = async (id: number, payload: UpdateEventPayload): Promise<Event> => {
  const response = await apiClient.put<Event>(`/api/events/${id}`, payload);
  return response.data;
};

export const uploadEntradaBackground = async (eventId: number, file: File): Promise<Event> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.put<Event>(`/api/events/${eventId}/entrada-background`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteEntradaBackground = async (eventId: number): Promise<Event> => {
  const response = await apiClient.delete<Event>(`/api/events/${eventId}/entrada-background`);
  return response.data;
};
