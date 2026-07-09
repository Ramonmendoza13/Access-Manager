package com.accessmanager.repository;

import com.accessmanager.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    @Query("SELECT t FROM Ticket t LEFT JOIN FETCH t.ticketType LEFT JOIN FETCH t.ticketTypeTemplate WHERE t.qrCode = :qrCode")
    Optional<Ticket> findByQrCode(@Param("qrCode") String qrCode);

    List<Ticket> findByHolderEmailContainingIgnoreCase(String email);
    long countByTicketTypeId(Long ticketTypeId);
    long countByTicketTypeEventId(Long eventId);
    List<Ticket> findByTicketType_IsSeasonPassTrue();
    List<Ticket> findByTicketType_IsSeasonPassTrueAndTicketType_Event_Id(Long eventId);
}
