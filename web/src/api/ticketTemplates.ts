import apiClient from './client';
import type { TicketTypeTemplate } from '../types';

export const getTemplates = async (): Promise<TicketTypeTemplate[]> => {
  const response = await apiClient.get<TicketTypeTemplate[]>(
    '/api/profile/ticket-templates'
  );
  return response.data;
};

export const createTemplate = async (
  name: string,
  price: number
): Promise<TicketTypeTemplate> => {
  const response = await apiClient.post<TicketTypeTemplate>(
    '/api/profile/ticket-templates',
    { name, price }
  );
  return response.data;
};

export const deleteTemplate = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/profile/ticket-templates/${id}`);
};
