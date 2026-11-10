package com.baloncam.features.reserva.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
public class ReservaDTO {
    private Long id;
    private String token;
    private Long canchaId;
    private String canchaNombre;
    private LocalDate fecha;
    private LocalTime horaInicio;
    private LocalTime horaFin;
    private String estado;
    private String clienteNombre;
    private String clienteTelefono;
    private String clienteEmail;
    private LocalDateTime createdAt;
}
