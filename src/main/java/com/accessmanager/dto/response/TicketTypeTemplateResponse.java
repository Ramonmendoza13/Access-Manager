package com.accessmanager.dto.response;

import java.math.BigDecimal;

public record TicketTypeTemplateResponse(
        Long id,
        String name,
        BigDecimal price
) {}
