package com.accessmanager.controller;

import com.accessmanager.dto.request.CreateTicketTypeTemplateRequest;
import com.accessmanager.dto.response.TicketTypeTemplateResponse;
import com.accessmanager.service.TicketTypeTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profile/ticket-templates")
@RequiredArgsConstructor
public class TicketTypeTemplateController {

    private final TicketTypeTemplateService ticketTypeTemplateService;

    @GetMapping
    public ResponseEntity<List<TicketTypeTemplateResponse>> findAll() {
        return ResponseEntity.ok(ticketTypeTemplateService.findAll());
    }

    @PostMapping
    public ResponseEntity<TicketTypeTemplateResponse> create(
            @Valid @RequestBody CreateTicketTypeTemplateRequest request) {
        TicketTypeTemplateResponse response = ticketTypeTemplateService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        ticketTypeTemplateService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
