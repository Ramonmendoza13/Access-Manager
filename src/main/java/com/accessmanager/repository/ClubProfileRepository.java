package com.accessmanager.repository;

import com.accessmanager.model.ClubProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClubProfileRepository extends JpaRepository<ClubProfile, Long> {
    Optional<ClubProfile> findFirstByOrderByIdAsc();
}
