package com.accessmanager.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CreateAbonoTypeRequest(
        @NotBlank String name,
        @Positive BigDecimal price
) {
}
