package com.accessmanager.service;

import com.accessmanager.dto.request.ScanRequest;
import com.accessmanager.dto.response.AccessLogResponse;
import com.accessmanager.dto.response.AccessStatsResponse;
import com.accessmanager.dto.response.ClubProfileResponse;
import com.accessmanager.dto.response.ScanResponse;
import com.accessmanager.exception.EventNotFoundException;
import com.accessmanager.model.Abonado;
import com.accessmanager.model.AccessLog;
import com.accessmanager.model.Event;
import com.accessmanager.model.SystemType;
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
import java.time.ZoneId;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccessService {

    private static final ZoneId ZONE = ZoneId.of("Europe/Madrid");

    private final TicketRepository ticketRepository;
    private final AbonadoRepository abonadoRepository;
    private final AccessLogRepository accessLogRepository;
    private final EventRepository eventRepository;
    private final ClubProfileService clubProfileService;

    @Transactional
    public ScanResponse scan(ScanRequest request) {

        // Obtener el tipo de sistema activo
        ClubProfileResponse profile = null;
        try {
            profile = clubProfileService.getProfile();
        } catch (Exception e) {
            log.warn("No se pudo obtener el perfil del club: {}", e.getMessage());
            return ScanResponse.denied("Sin perfil configurado");
        }

        LocalDate today = LocalDate.now(ZONE);

        // ============ BUSCAR COMO TICKET ============
        Optional<Ticket> ticketOpt = ticketRepository.findByQrCode(request.qrCode());
        if (ticketOpt.isPresent()) {
            Ticket ticket = ticketOpt.get();

            if (!ticket.getIsValid())
                return ScanResponse.denied("Entrada anulada");

            if (profile.systemType() == SystemType.FOOTBALL) {
                // FOOTBALL: uso único, sin importar la fecha
                if (accessLogRepository.existsByTicket_Id(ticket.getId()))
                    return ScanResponse.denied("Entrada ya utilizada");

            } else { // SWIMMING_POOL
                // Verificar que hoy está dentro de la temporada
                if (today.isBefore(profile.seasonStartDate()) ||
                    today.isAfter(profile.seasonEndDate()))
                    return ScanResponse.denied("Fuera de temporada");

                // Verificar que la entrada es para hoy
                if (ticket.getTargetDate() == null ||
                    !ticket.getTargetDate().equals(today))
                    return ScanResponse.denied("Esta entrada no es válida para hoy");

                // Verificar uso único
                if (accessLogRepository.existsByTicket_Id(ticket.getId()))
                    return ScanResponse.denied("Entrada ya utilizada");
            }

            // Registrar acceso — buscar evento activo (FOOTBALL) o sin evento (SWIMMING_POOL)
            Event event = eventRepository.findByActiveTrue().orElse(null);
            AccessLog accessLog = AccessLog.builder()
                .ticket(ticket).abonado(null)
                .event(event)  // puede ser null en SWIMMING_POOL
                .scannedAt(LocalDateTime.now())
                .deviceId(request.deviceId()).build();
            accessLogRepository.save(accessLog);
            return ScanResponse.allowedTicket(ticket);
        }

        // ============ BUSCAR COMO ABONADO ============
        Optional<Abonado> abonadoOpt = abonadoRepository.findByQrCode(request.qrCode());
        if (abonadoOpt.isPresent()) {
            Abonado abonado = abonadoOpt.get();

            if (!abonado.getActive())
                return ScanResponse.denied("Abono anulado");

            if (profile.systemType() == SystemType.FOOTBALL) {
                Event event = eventRepository.findByActiveTrue().orElse(null);
                if (event == null)
                    return ScanResponse.denied("No hay ningún evento activo");
                if (!event.getSeasonPassEnabled())
                    return ScanResponse.denied("Los abonos no están habilitados para este evento");

                LocalDateTime startOfDay = today.atStartOfDay();
                LocalDateTime endOfDay = today.atTime(23, 59, 59);
                if (accessLogRepository.existsByAbonado_IdAndEvent_IdAndScannedAtBetween(
                        abonado.getId(), event.getId(), startOfDay, endOfDay))
                    return ScanResponse.denied("Abono ya utilizado hoy — vuelve mañana");

                AccessLog accessLog = AccessLog.builder()
                    .ticket(null).abonado(abonado).event(event)
                    .scannedAt(LocalDateTime.now())
                    .deviceId(request.deviceId()).build();
                accessLogRepository.save(accessLog);
                return ScanResponse.allowedAbonado(abonado);

            } else { // SWIMMING_POOL
                // Verificar temporada
                if (today.isBefore(profile.seasonStartDate()) ||
                    today.isAfter(profile.seasonEndDate()))
                    return ScanResponse.denied("Fuera de temporada");

                // Verificar uso de hoy (sin necesidad de evento activo)
                LocalDateTime startOfDay = today.atStartOfDay();
                LocalDateTime endOfDay = today.atTime(23, 59, 59);
                if (accessLogRepository.existsByAbonado_IdAndScannedAtBetween(
                        abonado.getId(), startOfDay, endOfDay))
                    return ScanResponse.denied("Abono ya utilizado hoy — vuelve mañana");

                AccessLog accessLog = AccessLog.builder()
                    .ticket(null).abonado(abonado).event(null)
                    .scannedAt(LocalDateTime.now())
                    .deviceId(request.deviceId()).build();
                accessLogRepository.save(accessLog);
                return ScanResponse.allowedAbonado(abonado);
            }
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

        LocalDate today = LocalDate.now(ZONE);
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59);
        long seasonPassesScannedToday = accessLogRepository.countSeasonPassScannedTodayByEventId(
                eventId, startOfDay, endOfDay);

        return new AccessStatsResponse(totalTickets, scanned, remaining, seasonPassesScannedToday);
    }

    private AccessLogResponse mapToAccessLogResponse(AccessLog accessLog) {
        Long eventId = accessLog.getEvent() != null ? accessLog.getEvent().getId() : null;

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
                    eventId
            );
        } else {
            Ticket t = accessLog.getTicket();
            String typeName = t.getTicketType() != null ? t.getTicketType().getName() : "Entrada";
            Boolean isSeasonPass = t.getTicketType() != null ? t.getTicketType().getIsSeasonPass() : false;
            return new AccessLogResponse(
                    accessLog.getId(),
                    accessLog.getScannedAt(),
                    accessLog.getDeviceId(),
                    t.getHolderName(),
                    t.getHolderEmail(),
                    typeName,
                    isSeasonPass,
                    eventId
            );
        }
    }
}
