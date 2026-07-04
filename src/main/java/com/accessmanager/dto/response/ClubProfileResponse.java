package com.accessmanager.dto.response;

public record ClubProfileResponse(
        Long id,
        String teamName,
        String venue,
        Integer capacity,
        String abonoBackgroundUrl
) {}
