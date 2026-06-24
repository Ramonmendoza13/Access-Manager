package com.accessmanager.controller;

import com.accessmanager.dto.request.CreateTicketRequest;
import com.accessmanager.dto.response.AbonadoResponse;
import com.accessmanager.dto.response.TicketResponse;
import com.accessmanager.service.QrService;
import com.accessmanager.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@Tag(name = "Tickets", description = "Ticket management APIs")
public class TicketController {

    private final TicketService ticketService;
    private final QrService qrService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Sell a new ticket")
    public ResponseEntity<TicketResponse> sellTicket(@Valid @RequestBody CreateTicketRequest request) {
        TicketResponse response = ticketService.sellTicket(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SCANNER')")
    @Operation(summary = "Get ticket by ID")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.findById(id));
    }

    @PutMapping("/{id}/invalidate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Invalidate a ticket manually")
    public ResponseEntity<TicketResponse> invalidateTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.invalidateTicket(id));
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Search tickets by email")
    public ResponseEntity<List<TicketResponse>> searchTicketsByEmail(@RequestParam String email) {
        return ResponseEntity.ok(ticketService.searchByEmail(email));
    }

    @GetMapping(value = "/{id}/qr", produces = MediaType.IMAGE_PNG_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'SCANNER')")
    @Operation(summary = "Download QR code image for a ticket")
    public ResponseEntity<byte[]> getTicketQr(@PathVariable Long id) {
        TicketResponse ticket = ticketService.findById(id);
        byte[] qrBytes = qrService.generateQrBytes(ticket.qrCode());
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(qrBytes);
    }
}
