import apiClient from './client';
import type { ClubProfile } from '../types';

export const getProfile = async (): Promise<ClubProfile | null> => {
  try {
    const response = await apiClient.get<ClubProfile>('/api/profile');
    return response.data;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      (error as { response: { status: number } }).response?.status === 404
    ) {
      return null;
    }
    throw error;
  }
};

export const upsertProfile = async (data: {
  teamName: string;
  venue: string;
  capacity: number;
}): Promise<ClubProfile> => {
  const response = await apiClient.post<ClubProfile>('/api/profile', data);
  return response.data;
};

export const uploadAbonoBackground = async (file: File): Promise<ClubProfile> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.put<ClubProfile>('/api/profile/abono-background', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteAbonoBackground = async (): Promise<ClubProfile> => {
  const response = await apiClient.delete<ClubProfile>('/api/profile/abono-background');
  return response.data;
};
