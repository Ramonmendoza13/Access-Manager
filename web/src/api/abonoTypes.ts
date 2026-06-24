import apiClient from './client';
import type { AbonoType } from '../types';

export const getAbonoTypes = async (): Promise<AbonoType[]> => {
  const response = await apiClient.get<AbonoType[]>('/api/abono-types');
  return response.data;
};

export const createAbonoType = async (name: string, price: number): Promise<AbonoType> => {
  const response = await apiClient.post<AbonoType>('/api/abono-types', { name, price });
  return response.data;
};

export const deactivateAbonoType = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/abono-types/${id}`);
};
