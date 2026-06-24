package com.accessmanager.dto.response;

import java.time.LocalDateTime;

public record AccessLogResponse(
        Long id,
        LocalDateTime scannedAt,
        String deviceId,
        String holderName,
        String holderEmail,
        String ticketTypeName,
        boolean isSeasonPass,
        Long eventId
) {
}
