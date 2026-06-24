package com.accessmanager.service;

import com.accessmanager.dto.request.CreateTicketTypeRequest;
import com.accessmanager.dto.response.TicketTypeResponse;
import com.accessmanager.exception.EventNotFoundException;
import com.accessmanager.model.Event;
import com.accessmanager.model.TicketType;
import com.accessmanager.repository.EventRepository;
import com.accessmanager.repository.TicketTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketTypeService {

    private final TicketTypeRepository ticketTypeRepository;
    private final EventRepository eventRepository;

    @Transactional
    public TicketTypeResponse createTicketType(Long eventId, CreateTicketTypeRequest request) {
        log.info("Creating ticket type '{}' for event ID: {}", request.name(), eventId);
        
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> {
                    log.warn("Event not found with ID: {}", eventId);
                    return new EventNotFoundException("Event not found with ID: " + eventId);
                });

        TicketType ticketType = TicketType.builder()
                .name(request.name())
                .price(request.price())
                .isSeasonPass(request.isSeasonPass())
                .quota(request.quota())
                .event(event)
                .build();

        TicketType saved = ticketTypeRepository.save(ticketType);
        log.info("Ticket type created with ID: {} for event ID: {}", saved.getId(), eventId);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TicketTypeResponse> findByEventId(Long eventId) {
        log.info("Fetching ticket types for event ID: {}", eventId);
        
        if (!eventRepository.existsById(eventId)) {
            log.warn("Event not found with ID: {}", eventId);
            throw new EventNotFoundException("Event not found with ID: " + eventId);
        }

        return ticketTypeRepository.findByEventId(eventId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private TicketTypeResponse mapToResponse(TicketType ticketType) {
        return new TicketTypeResponse(
                ticketType.getId(),
                ticketType.getName(),
                ticketType.getPrice(),
                ticketType.getIsSeasonPass(),
                ticketType.getQuota()
        );
    }
}
