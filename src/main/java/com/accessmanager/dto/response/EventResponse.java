package com.accessmanager.dto.response;

import java.time.LocalDateTime;

public record EventResponse(
        Long id,
        String name,
        LocalDateTime date,
        String venue,
        Integer capacity,
        Boolean active,
        Boolean seasonPassEnabled
) {}
