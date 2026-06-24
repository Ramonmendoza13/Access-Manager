package com.accessmanager.service;

import com.accessmanager.dto.request.CreateAbonoTypeRequest;
import com.accessmanager.dto.response.AbonoTypeResponse;
import com.accessmanager.exception.AbonoTypeNotFoundException;
import com.accessmanager.model.AbonoType;
import com.accessmanager.repository.AbonoTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AbonoTypeService {

    private final AbonoTypeRepository abonoTypeRepository;

    @Transactional
    public AbonoTypeResponse create(CreateAbonoTypeRequest request) {
        log.info("Creating abono type: {}", request.name());

        abonoTypeRepository.findByNameIgnoreCase(request.name().trim())
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Ya existe un tipo de abono con el nombre: " + existing.getName());
                });

        AbonoType abonoType = AbonoType.builder()
                .name(request.name().trim())
                .price(request.price())
                .active(true)
                .build();

        abonoType = abonoTypeRepository.save(abonoType);
        log.info("Abono type created with id: {}", abonoType.getId());
        return mapToResponse(abonoType);
    }

    @Transactional(readOnly = true)
    public List<AbonoTypeResponse> findAllActive() {
        log.info("Fetching active abono types");
        return abonoTypeRepository.findByActiveTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AbonoTypeResponse deactivate(Long id) {
        log.info("Deactivating abono type with id: {}", id);
        AbonoType abonoType = abonoTypeRepository.findById(id)
                .orElseThrow(() -> new AbonoTypeNotFoundException("Tipo de abono no encontrado con id: " + id));

        abonoType.setActive(false);
        abonoType = abonoTypeRepository.save(abonoType);
        log.info("Abono type deactivated: id={}", id);
        return mapToResponse(abonoType);
    }

    private AbonoTypeResponse mapToResponse(AbonoType abonoType) {
        return new AbonoTypeResponse(
                abonoType.getId(),
                abonoType.getName(),
                abonoType.getPrice(),
                abonoType.getActive()
        );
    }
}
