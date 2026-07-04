package com.accessmanager.service;

import com.accessmanager.dto.request.CreateTicketTypeTemplateRequest;
import com.accessmanager.dto.response.TicketTypeTemplateResponse;
import com.accessmanager.model.TicketTypeTemplate;
import com.accessmanager.repository.TicketTypeTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketTypeTemplateService {

    private final TicketTypeTemplateRepository ticketTypeTemplateRepository;

    @Transactional
    public TicketTypeTemplateResponse create(CreateTicketTypeTemplateRequest request) {
        log.info("Creating ticket type template: name={}", request.name());
        TicketTypeTemplate template = TicketTypeTemplate.builder()
                .name(request.name())
                .price(request.price())
                .build();

        TicketTypeTemplate saved = ticketTypeTemplateRepository.save(template);
        log.info("Ticket type template created with ID: {}", saved.getId());
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TicketTypeTemplateResponse> findAll() {
        log.info("Fetching all ticket type templates");
        return ticketTypeTemplateRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void delete(Long id) {
        log.info("Deleting ticket type template with ID: {}", id);
        ticketTypeTemplateRepository.deleteById(id);
        log.info("Ticket type template deleted: ID={}", id);
    }

    private TicketTypeTemplateResponse mapToResponse(TicketTypeTemplate template) {
        return new TicketTypeTemplateResponse(
                template.getId(),
                template.getName(),
                template.getPrice()
        );
    }
}
