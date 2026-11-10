package com.baloncam.features.reserva.repository;

import com.baloncam.features.reserva.entity.BloqueoTemporal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;

public interface BloqueoTemporalRepository extends JpaRepository<BloqueoTemporal, Long> {

    Optional<BloqueoTemporal> findByToken(String token);

    @Query("""
        SELECT COUNT(b) > 0 FROM BloqueoTemporal b
        WHERE b.cancha.id = :canchaId
          AND b.fecha = :fecha
          AND b.horaInicio = :horaInicio
          AND b.expiresAt > :ahora
    """)
    boolean existeBloqueoVigente(Long canchaId, LocalDate fecha, LocalTime horaInicio, LocalDateTime ahora);

    @Modifying
    @Transactional
    @Query("DELETE FROM BloqueoTemporal b WHERE b.expiresAt < :ahora")
    int eliminarBloqueoExpirados(LocalDateTime ahora);
}
