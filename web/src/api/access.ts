import apiClient from './client';
import type { AccessLog, SpringPage } from '../types';

export const getLogs = async (
  eventId: number,
  page: number,
  size: number = 20
): Promise<SpringPage<AccessLog>> => {
  const response = await apiClient.get<SpringPage<AccessLog>>('/api/access/logs', {
    params: { eventId, page, size },
  });
  return response.data;
};
