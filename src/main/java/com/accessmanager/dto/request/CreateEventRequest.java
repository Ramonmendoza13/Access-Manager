package com.accessmanager.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public record CreateEventRequest(
        @NotBlank(message = "Name is required")
        String name,

        @NotNull(message = "Date is required")
        @Future(message = "Date must be in the future")
        LocalDateTime date,

        @NotBlank(message = "Venue is required")
        String venue,

        @NotNull(message = "Capacity is required")
        @Positive(message = "Capacity must be positive")
        Integer capacity
) {}
