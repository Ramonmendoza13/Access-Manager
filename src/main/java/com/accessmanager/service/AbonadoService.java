package com.accessmanager.service;

import com.accessmanager.dto.request.CreateAbonadoRequest;
import com.accessmanager.dto.response.AbonadoResponse;
import com.accessmanager.exception.AbonoTypeNotFoundException;
import com.accessmanager.model.Abonado;
import com.accessmanager.model.AbonoType;
import com.accessmanager.repository.AbonadoRepository;
import com.accessmanager.repository.AbonoTypeRepository;
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
public class AbonadoService {

    private final AbonadoRepository abonadoRepository;
    private final AbonoTypeRepository abonoTypeRepository;

    @Transactional
    public AbonadoResponse createAbonado(CreateAbonadoRequest request) {
        log.info("Creating abonado for: {}", request.holderEmail());

        AbonoType abonoType = abonoTypeRepository.findById(request.abonoTypeId())
                .orElseThrow(() -> new AbonoTypeNotFoundException("Tipo de abono no encontrado con id: " + request.abonoTypeId()));

        if (!abonoType.getActive()) {
            throw new IllegalArgumentException("El tipo de abono '" + abonoType.getName() + "' está desactivado");
        }

        Integer nextNumero = abonadoRepository.findMaxNumero().orElse(0) + 1;

        Abonado abonado = Abonado.builder()
                .numero(nextNumero)
                .holderName(request.holderName())
                .holderEmail(request.holderEmail())
                .qrCode(UUID.randomUUID().toString())
                .active(true)
                .createdAt(LocalDateTime.now())
                .abonoType(abonoType)
                .build();

        abonado = abonadoRepository.save(abonado);
        log.info("Abonado created with ID {} and numero {}, type: {}", abonado.getId(), abonado.getNumero(), abonoType.getName());

        return mapToResponse(abonado);
    }

    @Transactional(readOnly = true)
    public List<AbonadoResponse> findAll() {
        return abonadoRepository.findAllByOrderByNumeroAsc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deactivate(Long id) {
        log.info("Deactivating abonado ID {}", id);
        Abonado abonado = abonadoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Abonado not found"));
        abonado.setActive(false);
        abonadoRepository.save(abonado);
    }

    private AbonadoResponse mapToResponse(Abonado abonado) {
        return new AbonadoResponse(
                abonado.getId(),
                abonado.getNumero(),
                abonado.getHolderName(),
                abonado.getHolderEmail(),
                abonado.getQrCode(),
                abonado.getActive(),
                abonado.getCreatedAt(),
                abonado.getAbonoType().getName(),
                abonado.getAbonoType().getPrice()
        );
    }
}

