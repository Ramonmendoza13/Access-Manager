package com.accessmanager.repository;

import com.accessmanager.model.Abonado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AbonadoRepository extends JpaRepository<Abonado, Long> {

    Optional<Abonado> findByQrCode(String qrCode);

    @Query("SELECT MAX(a.numero) FROM Abonado a")
    Optional<Integer> findMaxNumero();

    List<Abonado> findAllByOrderByNumeroAsc();

    boolean existsByHolderEmail(String email);
}
