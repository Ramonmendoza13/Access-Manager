package com.accessmanager.dto.response;

import java.time.LocalDateTime;

public record SeasonResetResponse(
        boolean success,
        long eventsDeleted,
        long ticketsDeleted,
        long abonadosDeleted,
        long accessLogsDeleted,
        LocalDateTime resetAt
) {}
