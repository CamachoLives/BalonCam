package com.baloncam.features.reserva.entity;

import com.baloncam.features.cancha.entity.Cancha;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Lock temporal para prevenir reservas concurrentes.
 * Cuando un usuario inicia el proceso de reserva, se crea un bloqueo
 * que expira si no se confirma dentro del tiempo configurado (default 5min).
 */
@Entity
@Table(name = "bloqueos_temporales", indexes = {
    @Index(name = "idx_bloqueo_token", columnList = "token"),
    @Index(name = "idx_bloqueo_cancha_fecha_hora", columnList = "cancha_id, fecha, hora_inicio")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BloqueoTemporal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancha_id", nullable = false)
    private Cancha cancha;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(nullable = false, unique = true, length = 64)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public boolean estaVigente() {
        return LocalDateTime.now().isBefore(expiresAt);
    }
}
