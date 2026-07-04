package com.accessmanager.controller;

import com.accessmanager.dto.request.UpsertClubProfileRequest;
import com.accessmanager.dto.response.ClubProfileResponse;
import com.accessmanager.service.ClubProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ClubProfileController {

    private final ClubProfileService clubProfileService;

    @GetMapping
    public ResponseEntity<ClubProfileResponse> getProfile() {
        return ResponseEntity.ok(clubProfileService.getProfile());
    }

    @PostMapping
    public ResponseEntity<ClubProfileResponse> upsertProfile(
            @Valid @RequestBody UpsertClubProfileRequest request) {
        ClubProfileResponse response = clubProfileService.upsertProfile(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping(value = "/abono-background", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ClubProfileResponse> uploadAbonoBackground(
            @RequestParam("file") MultipartFile file) {
        ClubProfileResponse response = clubProfileService.saveAbonoBackground(file);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/abono-background")
    public ResponseEntity<ClubProfileResponse> deleteAbonoBackground() {
        return ResponseEntity.ok(clubProfileService.deleteAbonoBackground());
    }
}
