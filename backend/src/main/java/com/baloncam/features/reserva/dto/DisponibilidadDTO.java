package com.baloncam.features.reserva.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
public class DisponibilidadDTO {
    private Long canchaId;
    private String canchaNombre;
    private LocalDate fecha;
    private LocalTime horaInicio;
    private LocalTime horaFin;
    private String estado; // DISPONIBLE, BLOQUEADO, OCUPADO, PASADO
    private Double precioPorHora;
}
