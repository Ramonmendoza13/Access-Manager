package com.accessmanager.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ScanRequest(
        @NotBlank(message = "QR code is required")
        String qrCode,

        @NotBlank(message = "Device ID is required")
        String deviceId
) {
}
