package com.accessmanager.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateTicketRequest(
        @NotNull(message = "Ticket type ID is required")
        Long ticketTypeId,

        @NotBlank(message = "Holder name is required")
        String holderName,

        @Email(message = "Valid email is required")
        @NotBlank(message = "Holder email is required")
        String holderEmail
) {
}
