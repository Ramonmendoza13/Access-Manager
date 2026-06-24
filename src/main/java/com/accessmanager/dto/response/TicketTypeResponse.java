package com.accessmanager.dto.response;

import java.math.BigDecimal;

public record TicketTypeResponse(
        Long id,
        String name,
        BigDecimal price,
        Boolean isSeasonPass,
        Integer quota
) {}
