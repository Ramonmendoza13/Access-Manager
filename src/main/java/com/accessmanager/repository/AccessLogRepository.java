package com.accessmanager.repository;

import com.accessmanager.model.AccessLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface AccessLogRepository extends JpaRepository<AccessLog, Long> {

    boolean existsByTicket_Id(Long ticketId);

    Optional<AccessLog> findTopByTicket_IdOrderByScannedAtDesc(Long ticketId);

    boolean existsByTicket_IdAndScannedAtBetween(Long ticketId, LocalDateTime start, LocalDateTime end);

    Page<AccessLog> findByEventId(Long eventId, Pageable pageable);

    long countByEventId(Long eventId);

    boolean existsByAbonado_IdAndEvent_IdAndScannedAtBetween(
            Long abonadoId, Long eventId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(al) FROM AccessLog al " +
           "LEFT JOIN al.ticket t " +
           "LEFT JOIN t.ticketType tt " +
           "WHERE al.event.id = :eventId " +
           "AND (tt.isSeasonPass = true OR al.abonado IS NOT NULL) " +
           "AND al.scannedAt BETWEEN :startOfDay AND :endOfDay")
    long countSeasonPassScannedTodayByEventId(
            @Param("eventId") Long eventId,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay);

    boolean existsByAbonado_IdAndScannedAtBetween(
            Long abonadoId, LocalDateTime start, LocalDateTime end);
}
