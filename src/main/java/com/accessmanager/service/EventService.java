package com.accessmanager.service;

import com.accessmanager.dto.request.CreateEventRequest;
import com.accessmanager.dto.response.EventResponse;
import com.accessmanager.exception.EventNotFoundException;
import com.accessmanager.model.Event;
import com.accessmanager.model.TicketType;
import com.accessmanager.repository.EventRepository;
import com.accessmanager.repository.TicketTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final TicketTypeRepository ticketTypeRepository;

    @Transactional
    public EventResponse createEvent(CreateEventRequest request) {
        log.info("Creating new event: {}", request.name());
        Event event = Event.builder()
                .name(request.name())
                .date(request.date())
                .venue(request.venue())
                .capacity(request.capacity())
                .active(false)
                .build();

        Event savedEvent = eventRepository.save(event);
        log.info("Event created with ID: {}", savedEvent.getId());


        return mapToResponse(savedEvent);
    }

    @Transactional(readOnly = true)
    public List<EventResponse> findAll() {
        log.info("Fetching all events");
        return eventRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EventResponse findById(Long id) {
        log.info("Fetching event by ID: {}", id);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Event not found with ID: {}", id);
                    return new EventNotFoundException("Event not found with ID: " + id);
                });
        return mapToResponse(event);
    }

    @Transactional
    public EventResponse activateEvent(Long id) {
        log.info("Activating event ID: {}", id);
        Event eventToActivate = eventRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Event not found for activation with ID: {}", id);
                    return new EventNotFoundException("Event not found with ID: " + id);
                });

        // Deactivate previous active event if exists
        Optional<Event> activeEventOpt = eventRepository.findByActiveTrue();
        if (activeEventOpt.isPresent()) {
            Event activeEvent = activeEventOpt.get();
            if (!activeEvent.getId().equals(id)) {
                log.info("Deactivating currently active event ID: {}", activeEvent.getId());
                activeEvent.setActive(false);
                eventRepository.save(activeEvent);
            }
        }

        eventToActivate.setActive(true);
        Event activatedEvent = eventRepository.save(eventToActivate);
        log.info("Event ID: {} is now active", id);
        return mapToResponse(activatedEvent);
    }

    @Transactional
    public EventResponse toggleSeasonPass(Long id, boolean enabled) {
        log.info("Toggling seasonPassEnabled={} for event ID: {}", enabled, id);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Event not found for season-pass toggle with ID: {}", id);
                    return new EventNotFoundException("Event not found with ID: " + id);
                });
        event.setSeasonPassEnabled(enabled);
        Event saved = eventRepository.save(event);
        log.info("Event ID: {} seasonPassEnabled is now {}", id, enabled);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public EventResponse getActiveEvent() {
        log.info("Fetching active event");
        Event activeEvent = eventRepository.findByActiveTrue()
                .orElseThrow(() -> {
                    log.warn("No active event found");
                    return new EventNotFoundException("No active event found");
                });
        return mapToResponse(activeEvent);
    }

    private EventResponse mapToResponse(Event event) {
        return new EventResponse(
                event.getId(),
                event.getName(),
                event.getDate(),
                event.getVenue(),
                event.getCapacity(),
                event.getActive(),
                event.getSeasonPassEnabled()
        );
    }
}
