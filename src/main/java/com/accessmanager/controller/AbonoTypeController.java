package com.accessmanager.controller;

import com.accessmanager.dto.request.CreateAbonoTypeRequest;
import com.accessmanager.dto.response.AbonoTypeResponse;
import com.accessmanager.service.AbonoTypeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/abono-types")
@RequiredArgsConstructor
@Tag(name = "Abono Types", description = "Subscription type management APIs")
public class AbonoTypeController {

    private final AbonoTypeService abonoTypeService;

    @GetMapping
    @Operation(summary = "List all active abono types")
    public ResponseEntity<List<AbonoTypeResponse>> getActiveTypes() {
        return ResponseEntity.ok(abonoTypeService.findAllActive());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new abono type")
    public ResponseEntity<AbonoTypeResponse> createType(@Valid @RequestBody CreateAbonoTypeRequest request) {
        AbonoTypeResponse response = abonoTypeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate an abono type")
    public ResponseEntity<AbonoTypeResponse> deactivateType(@PathVariable Long id) {
        return ResponseEntity.ok(abonoTypeService.deactivate(id));
    }
}
