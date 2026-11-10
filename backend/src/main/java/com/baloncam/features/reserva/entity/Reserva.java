package com.baloncam.features.reserva.entity;

import com.baloncam.features.cancha.entity.Cancha;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "reservas", indexes = {
    @Index(name = "idx_reserva_token", columnList = "token"),
    @Index(name = "idx_reserva_cancha_fecha", columnList = "cancha_id, fecha")
})
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
    private EstadoReserva estado = EstadoReserva.PENDIENTE;

    @Column(nullable = false, unique = true, length = 64)
    private String token;

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

    public Reserva() {}

    public Long getId() { return id; }
    public Cancha getCancha() { return cancha; }
    public void setCancha(Cancha cancha) { this.cancha = cancha; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public LocalTime getHoraInicio() { return horaInicio; }
    public void setHoraInicio(LocalTime horaInicio) { this.horaInicio = horaInicio; }
    public LocalTime getHoraFin() { return horaFin; }
    public void setHoraFin(LocalTime horaFin) { this.horaFin = horaFin; }
    public EstadoReserva getEstado() { return estado; }
    public void setEstado(EstadoReserva estado) { this.estado = estado; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }
    public String getClienteTelefono() { return clienteTelefono; }
    public void setClienteTelefono(String clienteTelefono) { this.clienteTelefono = clienteTelefono; }
    public String getClienteEmail() { return clienteEmail; }
    public void setClienteEmail(String clienteEmail) { this.clienteEmail = clienteEmail; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getConfirmadaAt() { return confirmadaAt; }
    public void setConfirmadaAt(LocalDateTime confirmadaAt) { this.confirmadaAt = confirmadaAt; }
}
