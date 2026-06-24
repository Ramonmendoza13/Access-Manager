package com.accessmanager.repository;

import com.accessmanager.model.AbonoType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AbonoTypeRepository extends JpaRepository<AbonoType, Long> {
    List<AbonoType> findByActiveTrue();
    Optional<AbonoType> findByNameIgnoreCase(String name);
}
