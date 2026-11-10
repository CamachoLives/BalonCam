package com.baloncam.features.reserva.repository;

import com.baloncam.features.reserva.entity.EstadoReserva;
import com.baloncam.features.reserva.entity.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    Optional<Reserva> findByToken(String token);

    List<Reserva> findByCanchaIdAndFechaAndEstadoIn(Long canchaId, LocalDate fecha, List<EstadoReserva> estados);

    @Query("""
        SELECT COUNT(r) > 0 FROM Reserva r
        WHERE r.cancha.id = :canchaId
          AND r.fecha = :fecha
          AND r.horaInicio = :horaInicio
          AND r.estado IN ('PENDIENTE', 'CONFIRMADA')
    """)
    boolean existeReservaActiva(Long canchaId, LocalDate fecha, LocalTime horaInicio);

    @Query("""
        SELECT r FROM Reserva r
        JOIN FETCH r.cancha
        WHERE r.cancha.id = :canchaId AND r.fecha = :fecha
          AND r.estado IN ('PENDIENTE', 'CONFIRMADA')
        ORDER BY r.horaInicio
    """)
    List<Reserva> findReservasActivasPorCanchaYFecha(Long canchaId, LocalDate fecha);
}
