package com.accessmanager.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CreateTicketTypeRequest(
        @NotBlank(message = "Name is required")
        String name,

        @NotNull(message = "Price is required")
        @Positive(message = "Price must be positive")
        BigDecimal price,

        @NotNull(message = "isSeasonPass is required")
        Boolean isSeasonPass,

        @NotNull(message = "Quota is required")
        @Positive(message = "Quota must be positive")
        Integer quota
) {}
