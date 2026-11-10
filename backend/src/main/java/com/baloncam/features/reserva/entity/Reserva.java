package com.baloncam.features.reserva.entity;

import com.baloncam.features.cancha.entity.Cancha;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "reservas", indexes = {
    @Index(name = "idx_reserva_token", columnList = "token"),
    @Index(name = "idx_reserva_cancha_fecha", columnList = "cancha_id, fecha")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reserva {

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

    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoReserva estado = EstadoReserva.PENDIENTE;

    @Column(nullable = false, unique = true, length = 64)
    private String token;

    // Datos del cliente
    @Column(name = "cliente_nombre", nullable = false, length = 150)
    private String clienteNombre;

    @Column(name = "cliente_telefono", nullable = false, length = 20)
    private String clienteTelefono;

    @Column(name = "cliente_email", length = 150)
    private String clienteEmail;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "confirmada_at")
    private LocalDateTime confirmadaAt;
}
