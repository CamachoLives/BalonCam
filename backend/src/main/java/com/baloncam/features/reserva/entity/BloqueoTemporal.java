package com.baloncam.features.reserva.entity;

import com.baloncam.features.cancha.entity.Cancha;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "bloqueos_temporales", indexes = {
    @Index(name = "idx_bloqueo_token", columnList = "token"),
    @Index(name = "idx_bloqueo_cancha_fecha_hora", columnList = "cancha_id, fecha, hora_inicio")
})
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
    private LocalDateTime createdAt = LocalDateTime.now();

    public BloqueoTemporal() {}

    public boolean estaVigente() {
        return LocalDateTime.now().isBefore(expiresAt);
    }

    public Long getId() { return id; }
    public Cancha getCancha() { return cancha; }
    public void setCancha(Cancha cancha) { this.cancha = cancha; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public LocalTime getHoraInicio() { return horaInicio; }
    public void setHoraInicio(LocalTime horaInicio) { this.horaInicio = horaInicio; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
