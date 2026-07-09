package com.accessmanager.service;

import com.accessmanager.dto.request.UpsertClubProfileRequest;
import com.accessmanager.dto.response.ClubProfileResponse;
import com.accessmanager.exception.ProfileNotFoundException;
import com.accessmanager.model.ClubProfile;
import com.accessmanager.model.SystemType;
import com.accessmanager.repository.ClubProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClubProfileService {

    private final ClubProfileRepository clubProfileRepository;
    private final CloudinaryService cloudinaryService;

    @Transactional(readOnly = true)
    public ClubProfileResponse getProfile() {
        log.info("Fetching club profile");
        ClubProfile profile = clubProfileRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> {
                    log.warn("Club profile not found");
                    return new ProfileNotFoundException("Club profile not found");
                });
        return mapToResponse(profile);
    }

    @Transactional
    public ClubProfileResponse upsertProfile(UpsertClubProfileRequest request) {
        log.info("Upserting club profile: teamName={}, systemType={}", request.teamName(), request.systemType());
        ClubProfile profile = clubProfileRepository.findFirstByOrderByIdAsc()
                .orElse(ClubProfile.builder().build());

        // Validación para SWIMMING_POOL
        if (request.systemType() == SystemType.SWIMMING_POOL) {
            if (request.seasonStartDate() == null || request.seasonEndDate() == null) {
                throw new IllegalArgumentException(
                        "Las fechas de temporada son obligatorias para el modo piscina");
            }
            if (request.seasonEndDate().isBefore(request.seasonStartDate())) {
                throw new IllegalArgumentException(
                        "La fecha de fin de temporada no puede ser anterior a la fecha de inicio");
            }
        }

        profile.setTeamName(request.teamName());
        profile.setVenue(request.venue());
        profile.setCapacity(request.capacity());
        profile.setSystemType(request.systemType());
        profile.setSeasonStartDate(request.seasonStartDate());
        profile.setSeasonEndDate(request.seasonEndDate());

        ClubProfile saved = clubProfileRepository.save(profile);
        log.info("Club profile saved with ID: {}, systemType: {}", saved.getId(), saved.getSystemType());
        return mapToResponse(saved);
    }

    @Transactional
    public ClubProfileResponse saveAbonoBackground(MultipartFile file) {
        log.info("Uploading abono background image to Cloudinary, size={} bytes", file.getSize());
        ClubProfile profile = clubProfileRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> {
                    log.info("No club profile found, creating a minimal one for background upload");
                    return ClubProfile.builder()
                            .teamName("Mi Club")
                            .venue("Mi Estadio")
                            .capacity(0)
                            .build();
                });

        String url = cloudinaryService.uploadImage(file, "access-manager/abonos");
        profile.setAbonoBackgroundUrl(url);
        ClubProfile saved = clubProfileRepository.save(profile);
        log.info("Abono background URL saved: {}", url);
        return mapToResponse(saved);
    }

    @Transactional
    public ClubProfileResponse deleteAbonoBackground() {
        log.info("Deleting abono background image");
        ClubProfile profile = clubProfileRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new ProfileNotFoundException("Club profile not found"));
        profile.setAbonoBackgroundUrl(null);
        ClubProfile saved = clubProfileRepository.save(profile);
        return mapToResponse(saved);
    }

    private ClubProfileResponse mapToResponse(ClubProfile profile) {
        return new ClubProfileResponse(
                profile.getId(),
                profile.getTeamName(),
                profile.getVenue(),
                profile.getCapacity(),
                profile.getAbonoBackgroundUrl(),
                profile.getSystemType(),
                profile.getSeasonStartDate(),
                profile.getSeasonEndDate()
        );
    }
}
