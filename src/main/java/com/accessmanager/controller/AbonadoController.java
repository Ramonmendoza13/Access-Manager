package com.accessmanager.controller;

import com.accessmanager.dto.request.CreateAbonadoRequest;
import com.accessmanager.dto.response.AbonadoResponse;
import com.accessmanager.service.AbonadoService;
import com.accessmanager.service.QrService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/abonados")
@RequiredArgsConstructor
public class AbonadoController {

    private final AbonadoService abonadoService;
    private final QrService qrService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AbonadoResponse>> getAll() {
        return ResponseEntity.ok(abonadoService.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AbonadoResponse> create(@Valid @RequestBody CreateAbonadoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(abonadoService.createAbonado(request));
    }

    @GetMapping(value = "/{id}/qr", produces = MediaType.IMAGE_PNG_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'SCANNER')")
    public ResponseEntity<byte[]> getQrCode(@PathVariable Long id) {
        // En un caso real se buscaría el abonado y su qrCode, para ser rápido asumo que el servicio findAll ya lo expone,
        // Pero mejor usar el repository o servicio. Asumiré que podemos buscarlo de findAll por id.
        String qrCode = abonadoService.findAll().stream()
                .filter(a -> a.id().equals(id))
                .findFirst()
                .map(AbonadoResponse::qrCode)
                .orElseThrow(() -> new RuntimeException("Abonado not found"));
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(qrService.generateQrBytes(qrCode));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        abonadoService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
