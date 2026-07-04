package com.accessmanager.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CreateTicketTypeTemplateRequest(
        @NotBlank(message = "Name is required")
        String name,

        @Positive(message = "Price must be positive")
        BigDecimal price
) {}
