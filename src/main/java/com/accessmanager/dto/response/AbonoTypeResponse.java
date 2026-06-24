package com.accessmanager.dto.response;

import java.math.BigDecimal;

public record AbonoTypeResponse(
        Long id,
        String name,
        BigDecimal price,
        Boolean active
) {
}
