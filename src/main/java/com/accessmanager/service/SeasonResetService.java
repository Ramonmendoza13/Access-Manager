package com.accessmanager.service;

import com.accessmanager.dto.response.SeasonResetPreviewResponse;
import com.accessmanager.dto.response.SeasonResetResponse;
import com.accessmanager.repository.AbonadoRepository;
import com.accessmanager.repository.AccessLogRepository;
import com.accessmanager.repository.EventRepository;
import com.accessmanager.repository.TicketRepository;
import com.accessmanager.repository.TicketTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class SeasonResetService {

    private final AccessLogRepository accessLogRepo;
    private final TicketRepository ticketRepo;
    private final TicketTypeRepository ticketTypeRepo;
    private final AbonadoRepository abonadoRepo;
    private final EventRepository eventRepo;

    @Transactional
    public SeasonResetResponse resetSeason() {
        long eventsCount = eventRepo.count();
        long ticketsCount = ticketRepo.count();
        long abonadosCount = abonadoRepo.count();
        long accessLogsCount = accessLogRepo.count();

        log.warn("INICIANDO RESET DE TEMPORADA — Se borrarán: {} eventos, " +
                "{} entradas, {} abonados, {} registros de acceso",
                eventsCount, ticketsCount, abonadosCount, accessLogsCount);

        // Orden importante por las foreign keys:
        // 1. AccessLog (depende de Ticket, Abonado, Event)
        log.warn("Borrando {} registros de acceso (access_logs)...", accessLogsCount);
        accessLogRepo.deleteAllInBatch();

        // 2. Ticket (depende de TicketType)
        log.warn("Borrando {} entradas (tickets)...", ticketsCount);
        ticketRepo.deleteAllInBatch();

        // 3. TicketType (depende de Event)
        long ticketTypesCount = ticketTypeRepo.count();
        log.warn("Borrando {} tipos de entrada (ticket_types)...", ticketTypesCount);
        ticketTypeRepo.deleteAllInBatch();

        // 4. Abonado (independiente, pero relacionado con AbonoType — NO se borra AbonoType)
        log.warn("Borrando {} abonados...", abonadosCount);
        abonadoRepo.deleteAllInBatch();

        // 5. Event
        log.warn("Borrando {} eventos...", eventsCount);
        eventRepo.deleteAllInBatch();

        log.warn("RESET DE TEMPORADA COMPLETADO");

        return new SeasonResetResponse(
                true,
                eventsCount, ticketsCount, abonadosCount, accessLogsCount,
                LocalDateTime.now()
        );
    }

    public SeasonResetPreviewResponse previewReset() {
        return new SeasonResetPreviewResponse(
                eventRepo.count(),
                ticketRepo.count(),
                abonadoRepo.count(),
                accessLogRepo.count()
        );
    }
}
