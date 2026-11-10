package com.baloncam.features.reserva.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
public class BloqueoResponseDTO {
    private String token;
    private LocalDateTime expiresAt;
    private int duracionMinutos;
    private Long canchaId;
    private LocalDate fecha;
    private LocalTime horaInicio;
}
