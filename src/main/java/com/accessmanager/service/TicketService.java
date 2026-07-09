package com.accessmanager.service;

import com.accessmanager.dto.request.CreateTicketRequest;
import com.accessmanager.dto.response.ClubProfileResponse;
import com.accessmanager.dto.response.TicketResponse;
import com.accessmanager.exception.QuotaExceededException;
import com.accessmanager.exception.TicketNotFoundException;
import com.accessmanager.exception.TicketTypeNotFoundException;
import com.accessmanager.model.SystemType;
import com.accessmanager.model.Ticket;
import com.accessmanager.model.TicketType;
import com.accessmanager.model.TicketTypeTemplate;
import com.accessmanager.repository.AccessLogRepository;
import com.accessmanager.repository.TicketRepository;
import com.accessmanager.repository.TicketTypeRepository;
import com.accessmanager.repository.TicketTypeTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketTypeRepository ticketTypeRepository;
    private final TicketTypeTemplateRepository ticketTypeTemplateRepository;
    private final AccessLogRepository accessLogRepository;
    private final ClubProfileService clubProfileService;

    @Transactional
    public TicketResponse sellTicket(CreateTicketRequest request) {
        log.info("Selling ticket for type id: {}", request.ticketTypeId());

        Ticket.TicketBuilder builder = Ticket.builder()
                .holderName(request.holderName())
                .holderEmail(request.holderEmail())
                .qrCode(UUID.randomUUID().toString())
                .purchasedAt(LocalDateTime.now())
                .isValid(true);

        try {
            ClubProfileResponse profile = clubProfileService.getProfile();
            if (profile.systemType() == SystemType.SWIMMING_POOL) {
                // Modo Piscina: el ID viene de TicketTypeTemplate
                TicketTypeTemplate template = ticketTypeTemplateRepository.findById(request.ticketTypeId())
                        .orElseThrow(() -> new TicketTypeNotFoundException("TicketTypeTemplate not found with id " + request.ticketTypeId()));
                
                builder.ticketTypeTemplate(template);

                if (request.targetDate() == null) {
                    throw new IllegalArgumentException(
                            "La fecha objetivo (targetDate) es obligatoria para el modo piscina");
                }
                if (request.targetDate().isBefore(profile.seasonStartDate()) ||
                    request.targetDate().isAfter(profile.seasonEndDate())) {
                    throw new IllegalArgumentException(
                            "La fecha objetivo debe estar dentro de la temporada (" +
                            profile.seasonStartDate() + " a " + profile.seasonEndDate() + ")");
                }
                builder.targetDate(request.targetDate());
                log.info("SWIMMING_POOL ticket: targetDate={}", request.targetDate());
            } else {
                // Modo Fútbol: el ID viene de TicketType
                TicketType ticketType = ticketTypeRepository.findById(request.ticketTypeId())
                        .orElseThrow(() -> new TicketTypeNotFoundException("TicketType not found with id " + request.ticketTypeId()));
                
                long currentCount = ticketRepository.countByTicketTypeId(ticketType.getId());
                if (currentCount >= ticketType.getQuota()) {
                    log.warn("Quota exceeded for ticket type id: {}. Current count: {}, Quota: {}", ticketType.getId(), currentCount, ticketType.getQuota());
                    throw new QuotaExceededException("Quota exceeded for ticket type: " + ticketType.getName());
                }
                builder.ticketType(ticketType);
            }
        } catch (IllegalArgumentException | TicketTypeNotFoundException | QuotaExceededException e) {
            throw e;
        } catch (Exception e) {
            log.warn("No se pudo procesar la compra correctamente: {}", e.getMessage());
            throw new RuntimeException("Error processing ticket purchase: " + e.getMessage());
        }

        Ticket ticket = builder.build();
        ticket = ticketRepository.save(ticket);
        log.info("Ticket sold successfully with id: {}", ticket.getId());

        return mapToResponse(ticket);
    }

    @Transactional(readOnly = true)
    public TicketResponse findById(Long id) {
        log.info("Fetching ticket with id: {}", id);
        return ticketRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found with id " + id));
    }

    @Transactional
    public TicketResponse invalidateTicket(Long id) {
        log.info("Invalidating ticket with id: {}", id);
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found with id " + id));
        
        ticket.setIsValid(false);
        ticket = ticketRepository.save(ticket);
        return mapToResponse(ticket);
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> searchByEmail(String email) {
        log.info("Searching tickets by email: {}", email);
        return ticketRepository.findByHolderEmailContainingIgnoreCase(email)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private TicketResponse mapToResponse(Ticket ticket) {
        String typeName = ticket.getTicketType() != null 
                ? ticket.getTicketType().getName() 
                : (ticket.getTicketTypeTemplate() != null ? ticket.getTicketTypeTemplate().getName() : "Unknown");
        
        java.math.BigDecimal price = ticket.getTicketType() != null 
                ? ticket.getTicketType().getPrice() 
                : (ticket.getTicketTypeTemplate() != null ? ticket.getTicketTypeTemplate().getPrice() : java.math.BigDecimal.ZERO);
                
        Boolean isSeasonPass = ticket.getTicketType() != null 
                ? ticket.getTicketType().getIsSeasonPass() 
                : false;
                
        String eventName = (ticket.getTicketType() != null && ticket.getTicketType().getEvent() != null)
                ? ticket.getTicketType().getEvent().getName() 
                : "Temporada Piscina";
                
        Long eventId = (ticket.getTicketType() != null && ticket.getTicketType().getEvent() != null)
                ? ticket.getTicketType().getEvent().getId() 
                : null;

        return new TicketResponse(
                ticket.getId(),
                ticket.getQrCode(),
                ticket.getHolderName(),
                ticket.getHolderEmail(),
                ticket.getPurchasedAt(),
                ticket.getIsValid(),
                typeName,
                price,
                isSeasonPass,
                eventName,
                eventId,
                ticket.getTargetDate()
        );
    }

    // Abonados logic has been moved to AbonadoService.

}
