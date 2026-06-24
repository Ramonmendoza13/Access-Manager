package com.accessmanager.dto.response;

import com.accessmanager.model.AccessLog;
import com.accessmanager.model.Ticket;

import java.time.LocalDateTime;

public record ScanResponse(
        boolean allowed,
        String message,
        String holderName,
        String ticketType,
        boolean isSeasonPass,
        LocalDateTime scannedAt
) {

    public static ScanResponse allowedTicket(Ticket ticket) {
        return new ScanResponse(
                true,
                "Acceso concedido",
                ticket.getHolderName(),
                ticket.getTicketType().getName(),
                false,
                LocalDateTime.now()
        );
    }

    public static ScanResponse allowedAbonado(com.accessmanager.model.Abonado abonado) {
        return new ScanResponse(
                true,
                "Acceso concedido",
                abonado.getHolderName(),
                "Abonado " + abonado.getAbonoType().getName() + " nº" + abonado.getNumero(),
                true,
                LocalDateTime.now()
        );
    }

    public static ScanResponse denied(String reason) {
        return new ScanResponse(
                false,
                reason,
                null,
                null,
                false,
                null
        );
    }
}
