import apiClient from './client';

export interface LoginResponse {
  token: string;
  email: string;
  role: string;
}

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/api/auth/login', { email, password });
  return response.data;
};
