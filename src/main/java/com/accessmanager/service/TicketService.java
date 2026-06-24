package com.accessmanager.service;

import com.accessmanager.dto.request.CreateTicketRequest;
import com.accessmanager.dto.response.AbonadoResponse;
import com.accessmanager.dto.response.TicketResponse;
import com.accessmanager.exception.QuotaExceededException;
import com.accessmanager.exception.TicketNotFoundException;
import com.accessmanager.exception.TicketTypeNotFoundException;
import com.accessmanager.model.AccessLog;
import com.accessmanager.model.Ticket;
import com.accessmanager.model.TicketType;
import com.accessmanager.repository.AccessLogRepository;
import com.accessmanager.repository.TicketRepository;
import com.accessmanager.repository.TicketTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    private final AccessLogRepository accessLogRepository;

    @Transactional
    public TicketResponse sellTicket(CreateTicketRequest request) {
        log.info("Selling ticket for type id: {}", request.ticketTypeId());

        TicketType ticketType = ticketTypeRepository.findById(request.ticketTypeId())
                .orElseThrow(() -> new TicketTypeNotFoundException("TicketType not found with id " + request.ticketTypeId()));

        long currentCount = ticketRepository.countByTicketTypeId(ticketType.getId());
        if (currentCount >= ticketType.getQuota()) {
            log.warn("Quota exceeded for ticket type id: {}. Current count: {}, Quota: {}", ticketType.getId(), currentCount, ticketType.getQuota());
            throw new QuotaExceededException("Quota exceeded for ticket type: " + ticketType.getName());
        }

        String qrCode = UUID.randomUUID().toString();

        Ticket ticket = Ticket.builder()
                .ticketType(ticketType)
                .holderName(request.holderName())
                .holderEmail(request.holderEmail())
                .qrCode(qrCode)
                .purchasedAt(LocalDateTime.now())
                .isValid(true)
                .build();

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
        return new TicketResponse(
                ticket.getId(),
                ticket.getQrCode(),
                ticket.getHolderName(),
                ticket.getHolderEmail(),
                ticket.getPurchasedAt(),
                ticket.getIsValid(),
                ticket.getTicketType().getName(),
                ticket.getTicketType().getPrice(),
                ticket.getTicketType().getIsSeasonPass(),
                ticket.getTicketType().getEvent().getName(),
                ticket.getTicketType().getEvent().getId()
        );
    }

    // Abonados logic has been moved to AbonadoService.

}
