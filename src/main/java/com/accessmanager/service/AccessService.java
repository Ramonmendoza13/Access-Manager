package com.accessmanager.service;

import com.accessmanager.dto.request.ScanRequest;
import com.accessmanager.dto.response.AccessLogResponse;
import com.accessmanager.dto.response.AccessStatsResponse;
import com.accessmanager.dto.response.ScanResponse;
import com.accessmanager.exception.EventNotFoundException;
import com.accessmanager.model.Abonado;
import com.accessmanager.model.AccessLog;
import com.accessmanager.model.Event;
import com.accessmanager.model.Ticket;
import com.accessmanager.repository.AbonadoRepository;
import com.accessmanager.repository.AccessLogRepository;
import com.accessmanager.repository.EventRepository;
import com.accessmanager.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccessService {

    private final TicketRepository ticketRepository;
    private final AbonadoRepository abonadoRepository;
    private final AccessLogRepository accessLogRepository;
    private final EventRepository eventRepository;

    @Transactional
    public ScanResponse scan(ScanRequest request) {
        
        // INTENTO 1: buscar como entrada normal
        Optional<Ticket> ticketOpt = ticketRepository.findByQrCode(request.qrCode());
        if (ticketOpt.isPresent()) {
            Ticket ticket = ticketOpt.get();
            if (!ticket.getIsValid()) 
                return ScanResponse.denied("Entrada anulada");
            if (accessLogRepository.existsByTicket_Id(ticket.getId()))
                return ScanResponse.denied("Entrada ya utilizada");
            
            // registra acceso de entrada
            AccessLog log = AccessLog.builder()
                .ticket(ticket).abonado(null)
                .event(ticket.getTicketType().getEvent())
                .scannedAt(LocalDateTime.now())
                .deviceId(request.deviceId()).build();
            accessLogRepository.save(log);
            return ScanResponse.allowedTicket(ticket);
        }
        
        // INTENTO 2: buscar como abonado
        Optional<Abonado> abonadoOpt = abonadoRepository.findByQrCode(request.qrCode());
        if (abonadoOpt.isPresent()) {
            Abonado abonado = abonadoOpt.get();
            
            if (!abonado.getActive())
                return ScanResponse.denied("Abono anulado");
            
            // obtener evento activo
            Event event = eventRepository.findByActiveTrue()
                .orElse(null);
            if (event == null)
                return ScanResponse.denied("No hay ningún evento activo");
            
            if (!event.getSeasonPassEnabled())
                return ScanResponse.denied("Los abonos no están habilitados para este evento");
            
            // verificar que no ha entrado hoy a ESTE evento
            LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
            LocalDateTime endOfDay = LocalDate.now().atTime(23, 59, 59);
            boolean usedToday = accessLogRepository
                .existsByAbonado_IdAndEvent_IdAndScannedAtBetween(
                    abonado.getId(), event.getId(), startOfDay, endOfDay);
            if (usedToday)
                return ScanResponse.denied("Abono ya utilizado hoy — vuelve mañana");
            
            // registra acceso de abonado
            AccessLog log = AccessLog.builder()
                .ticket(null).abonado(abonado)
                .event(event)
                .scannedAt(LocalDateTime.now())
                .deviceId(request.deviceId()).build();
            accessLogRepository.save(log);
            return ScanResponse.allowedAbonado(abonado);
        }
        
        return ScanResponse.denied("QR no válido");
    }

    @Transactional(readOnly = true)
    public Page<AccessLogResponse> getLogsByEvent(Long eventId, Pageable pageable) {
        log.info("Fetching access logs for eventId={}, page={}", eventId, pageable.getPageNumber());

        eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException("Event not found with id " + eventId));

        return accessLogRepository.findByEventId(eventId, pageable)
                .map(this::mapToAccessLogResponse);
    }

    @Transactional(readOnly = true)
    public AccessStatsResponse getStatsByEvent(Long eventId) {
        log.info("Calculating access stats for eventId={}", eventId);

        eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException("Event not found with id " + eventId));

        long totalTickets = ticketRepository.countByTicketTypeEventId(eventId);
        long scanned = accessLogRepository.countByEventId(eventId);
        long remaining = totalTickets - scanned;

        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59);
        long seasonPassesScannedToday = accessLogRepository.countSeasonPassScannedTodayByEventId(
                eventId, startOfDay, endOfDay);

        return new AccessStatsResponse(totalTickets, scanned, remaining, seasonPassesScannedToday);
    }

    private AccessLogResponse mapToAccessLogResponse(AccessLog accessLog) {
        if (accessLog.getAbonado() != null) {
            Abonado a = accessLog.getAbonado();
            return new AccessLogResponse(
                    accessLog.getId(),
                    accessLog.getScannedAt(),
                    accessLog.getDeviceId(),
                    a.getHolderName(),
                    a.getHolderEmail(),
                    "Abonado " + a.getAbonoType().getName() + " nº" + a.getNumero(),
                    true,
                    accessLog.getEvent().getId()
            );
        } else {
            Ticket t = accessLog.getTicket();
            return new AccessLogResponse(
                    accessLog.getId(),
                    accessLog.getScannedAt(),
                    accessLog.getDeviceId(),
                    t.getHolderName(),
                    t.getHolderEmail(),
                    t.getTicketType().getName(),
                    t.getTicketType().getIsSeasonPass(),
                    accessLog.getEvent().getId()
            );
        }
    }
}
