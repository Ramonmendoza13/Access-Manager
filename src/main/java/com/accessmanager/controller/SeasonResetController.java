package com.accessmanager.controller;

import com.accessmanager.dto.request.ConfirmResetRequest;
import com.accessmanager.dto.response.SeasonResetPreviewResponse;
import com.accessmanager.exception.GlobalExceptionHandler.ErrorResponse;
import com.accessmanager.service.SeasonResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/season-reset")
@RequiredArgsConstructor
public class SeasonResetController {

    private final SeasonResetService seasonResetService;

    @GetMapping("/preview")
    @PreAuthorize("hasRole('ADMIN')")
    public SeasonResetPreviewResponse preview() {
        return seasonResetService.previewReset();
    }

    @PostMapping("/confirm")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> confirm(@Valid @RequestBody ConfirmResetRequest request) {
        if (!"BORRAR TEMPORADA".equals(request.confirmationWord())) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Palabra de confirmación incorrecta",
                            400, LocalDateTime.now()));
        }
        return ResponseEntity.ok(seasonResetService.resetSeason());
    }
}
