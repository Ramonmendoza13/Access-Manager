package com.accessmanager.controller;

import com.accessmanager.dto.request.CreateEventRequest;
import com.accessmanager.dto.request.UpdateEventRequest;
import com.accessmanager.dto.response.EventResponse;
import com.accessmanager.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public ResponseEntity<List<EventResponse>> getAllEvents() {
        return ResponseEntity.ok(eventService.findAll());
    }

    @PostMapping
    public ResponseEntity<EventResponse> createEvent(@Valid @RequestBody CreateEventRequest request) {
        EventResponse created = eventService.createEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> getEventById(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.findById(id));
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<EventResponse> activateEvent(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.activateEvent(id));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<EventResponse> deactivateEvent(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.deactivateEvent(id));
    }

    @GetMapping("/active")
    public ResponseEntity<EventResponse> getActiveEvent() {
        return ResponseEntity.ok(eventService.getActiveEvent());
    }

    @PutMapping("/{id}/season-pass")
    public ResponseEntity<EventResponse> toggleSeasonPass(
            @PathVariable Long id,
            @RequestParam boolean enabled) {
        return ResponseEntity.ok(eventService.toggleSeasonPass(id, enabled));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventResponse> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEventRequest request) {
        return ResponseEntity.ok(eventService.updateEvent(id, request));
    }

    @PutMapping(value = "/{id}/entrada-background", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EventResponse> uploadEntradaBackground(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        EventResponse response = eventService.saveEntradaBackground(id, file);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/entrada-background")
    public ResponseEntity<EventResponse> deleteEntradaBackground(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.deleteEntradaBackground(id));
    }
}
