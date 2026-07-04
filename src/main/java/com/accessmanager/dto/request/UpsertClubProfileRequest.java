package com.accessmanager.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record UpsertClubProfileRequest(
        @NotBlank(message = "Team name is required")
        String teamName,

        @NotBlank(message = "Venue is required")
        String venue,

        @Positive(message = "Capacity must be positive")
        Integer capacity
) {}
