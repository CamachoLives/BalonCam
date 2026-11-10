package com.baloncam.features.reserva.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record DisponibilidadDTO(
    Long canchaId,
    String canchaNombre,
    LocalDate fecha,
    LocalTime horaInicio,
    LocalTime horaFin,
    String estado,
    Double precioPorHora
) {}
