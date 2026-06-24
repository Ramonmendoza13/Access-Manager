package com.accessmanager.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AbonadoResponse(
        Long id,
        Integer numero,
        String holderName,
        String holderEmail,
        String qrCode,
        Boolean active,
        LocalDateTime createdAt,
        String abonoTypeName,
        BigDecimal abonoTypePrice
) {
}
