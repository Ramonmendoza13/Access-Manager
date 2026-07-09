import apiClient from './client';

export interface SeasonResetPreview {
  eventsCount: number;
  ticketsCount: number;
  abonadosCount: number;
  accessLogsCount: number;
}

export interface SeasonResetResult {
  success: boolean;
  eventsDeleted: number;
  ticketsDeleted: number;
  abonadosDeleted: number;
  accessLogsDeleted: number;
  resetAt: string;
}

export const previewReset = async (): Promise<SeasonResetPreview> => {
  const response = await apiClient.get<SeasonResetPreview>('/api/season-reset/preview');
  return response.data;
};

export const confirmReset = async (confirmationWord: string): Promise<SeasonResetResult> => {
  const response = await apiClient.post<SeasonResetResult>('/api/season-reset/confirm', {
    confirmationWord,
  });
  return response.data;
};
