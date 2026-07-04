package com.accessmanager.repository;

import com.accessmanager.model.TicketTypeTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketTypeTemplateRepository extends JpaRepository<TicketTypeTemplate, Long> {
}
