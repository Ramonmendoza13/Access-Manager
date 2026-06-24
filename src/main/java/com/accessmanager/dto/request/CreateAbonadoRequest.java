package com.accessmanager.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateAbonadoRequest(
        @NotBlank String holderName,
        @Email @NotBlank String holderEmail,
        @NotNull Long abonoTypeId
) {
}
