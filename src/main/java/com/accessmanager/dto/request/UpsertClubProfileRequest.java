package com.accessmanager.dto.request;

import com.accessmanager.model.SystemType;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

public record UpsertClubProfileRequest(
        @NotBlank(message = "Team name is required")
        String teamName,

        @NotBlank(message = "Venue is required")
        String venue,

        @Positive(message = "Capacity must be positive")
        Integer capacity,

        @NotNull(message = "System type is required")
        SystemType systemType,

        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate seasonStartDate,

        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate seasonEndDate
) {}
