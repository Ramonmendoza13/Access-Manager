package com.accessmanager.controller;

import com.accessmanager.dto.request.ScanRequest;
import com.accessmanager.dto.response.AccessLogResponse;
import com.accessmanager.dto.response.AccessStatsResponse;
import com.accessmanager.dto.response.ScanResponse;
import com.accessmanager.service.AccessService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/access")
@RequiredArgsConstructor
@Tag(name = "Access Control", description = "QR scanning and access management")
public class AccessController {

    private final AccessService accessService;

    @PostMapping("/scan")
    @PreAuthorize("hasAnyRole('ADMIN', 'SCANNER')")
    @Operation(summary = "Scan a QR code for event access")
    public ResponseEntity<ScanResponse> scan(@Valid @RequestBody ScanRequest request) {
        ScanResponse response = accessService.scan(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/logs")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get paginated access logs for an event")
    public ResponseEntity<Page<AccessLogResponse>> getLogs(
            @RequestParam Long eventId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "scannedAt"));
        return ResponseEntity.ok(accessService.getLogsByEvent(eventId, pageRequest));
    }

    @GetMapping("/stats/{eventId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get access statistics for an event")
    public ResponseEntity<AccessStatsResponse> getStats(@PathVariable Long eventId) {
        return ResponseEntity.ok(accessService.getStatsByEvent(eventId));
    }
}
