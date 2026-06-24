package com.accessmanager.controller;

import com.accessmanager.dto.request.CreateTicketTypeRequest;
import com.accessmanager.dto.response.TicketTypeResponse;
import com.accessmanager.service.TicketTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/ticket-types")
@RequiredArgsConstructor
public class TicketTypeController {

    private final TicketTypeService ticketTypeService;

    @GetMapping
    public ResponseEntity<List<TicketTypeResponse>> getTicketTypesByEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(ticketTypeService.findByEventId(eventId));
    }

    @PostMapping
    public ResponseEntity<TicketTypeResponse> createTicketType(
            @PathVariable Long eventId,
            @Valid @RequestBody CreateTicketTypeRequest request
    ) {
        TicketTypeResponse created = ticketTypeService.createTicketType(eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
