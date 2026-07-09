package com.accessmanager.dto.response;

import com.accessmanager.model.SystemType;

import java.time.LocalDate;

public record ClubProfileResponse(
        Long id,
        String teamName,
        String venue,
        Integer capacity,
        String abonoBackgroundUrl,
        SystemType systemType,
        LocalDate seasonStartDate,
        LocalDate seasonEndDate
) {}
