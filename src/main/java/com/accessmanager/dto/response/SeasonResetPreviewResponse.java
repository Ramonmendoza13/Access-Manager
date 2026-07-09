package com.accessmanager.dto.response;

public record SeasonResetPreviewResponse(
        long eventsCount,
        long ticketsCount,
        long abonadosCount,
        long accessLogsCount
) {}
