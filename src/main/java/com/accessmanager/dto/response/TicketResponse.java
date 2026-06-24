package com.accessmanager.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TicketResponse(
        Long id,
        String qrCode,
        String holderName,
        String holderEmail,
        LocalDateTime purchasedAt,
        Boolean isValid,
        String ticketTypeName,
        BigDecimal price,
        Boolean isSeasonPass,
        String eventName,
        Long eventId
) {
}
