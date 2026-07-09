package com.accessmanager.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ConfirmResetRequest(
        @NotBlank String confirmationWord
) {}
