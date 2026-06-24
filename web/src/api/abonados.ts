import apiClient from './client';
import type { AbonadoEntry } from '../types';

export interface CreateAbonadoPayload {
  holderName: string;
  holderEmail: string;
  abonoTypeId: number;
}

export const getAbonados = async (): Promise<AbonadoEntry[]> => {
  const response = await apiClient.get<AbonadoEntry[]>('/api/abonados');
  return response.data;
};

export const createAbonado = async (payload: CreateAbonadoPayload): Promise<AbonadoEntry> => {
  const response = await apiClient.post<AbonadoEntry>('/api/abonados', payload);
  return response.data;
};

export const getAbonadoQrUrl = (id: number): string => {
  return `${apiClient.defaults.baseURL}/api/abonados/${id}/qr`;
};

export const getAbonadoQrBlob = async (id: number): Promise<Blob> => {
  const response = await apiClient.get(`/api/abonados/${id}/qr`, {
    responseType: 'blob',
  });
  return response.data;
};

export const deactivateAbonado = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/abonados/${id}`);
};
