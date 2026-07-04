package com.accessmanager.service;

import com.accessmanager.dto.request.CreateEventRequest;
import com.accessmanager.dto.request.UpdateEventRequest;
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
import org.springframework.web.multipart.MultipartFile;

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
    private final CloudinaryService cloudinaryService;

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
    public EventResponse deactivateEvent(Long id) {
        log.info("Deactivating event ID: {}", id);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Event not found for deactivation with ID: {}", id);
                    return new EventNotFoundException("Event not found with ID: " + id);
                });

        if (!event.getActive()) {
            log.info("Event ID: {} is already inactive, no-op", id);
            return mapToResponse(event);
        }

        event.setActive(false);
        Event saved = eventRepository.save(event);
        log.info("Event ID: {} is now inactive", id);
        return mapToResponse(saved);
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

    @Transactional
    public EventResponse updateEvent(Long id, UpdateEventRequest request) {
        log.info("Updating event ID: {}", id);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Event not found for update with ID: {}", id);
                    return new EventNotFoundException("Event not found with ID: " + id);
                });

        event.setName(request.name());
        event.setDate(request.date());
        event.setVenue(request.venue());
        event.setCapacity(request.capacity());

        Event saved = eventRepository.save(event);
        log.info("Event ID: {} updated successfully", id);
        return mapToResponse(saved);
    }

    @Transactional
    public EventResponse saveEntradaBackground(Long eventId, MultipartFile file) {
        log.info("Uploading entrada background image to Cloudinary for event ID: {}, size={} bytes",
                eventId, file.getSize());
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> {
                    log.warn("Event not found for background upload with ID: {}", eventId);
                    return new EventNotFoundException("Event not found with ID: " + eventId);
                });

        String url = cloudinaryService.uploadImage(file, "access-manager/eventos/" + eventId);
        event.setEntradaBackgroundUrl(url);
        Event saved = eventRepository.save(event);
        log.info("Entrada background URL saved for event ID: {}: {}", eventId, url);
        return mapToResponse(saved);
    }

    @Transactional
    public EventResponse deleteEntradaBackground(Long eventId) {
        log.info("Deleting entrada background image for event ID: {}", eventId);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> {
                    log.warn("Event not found for background deletion with ID: {}", eventId);
                    return new EventNotFoundException("Event not found with ID: " + eventId);
                });
        event.setEntradaBackgroundUrl(null);
        Event saved = eventRepository.save(event);
        log.info("Entrada background deleted for event ID: {}", eventId);
        return mapToResponse(saved);
    }

    private EventResponse mapToResponse(Event event) {
        return new EventResponse(
                event.getId(),
                event.getName(),
                event.getDate(),
                event.getVenue(),
                event.getCapacity(),
                event.getActive(),
                event.getSeasonPassEnabled(),
                event.getEntradaBackgroundUrl()
        );
    }
}
