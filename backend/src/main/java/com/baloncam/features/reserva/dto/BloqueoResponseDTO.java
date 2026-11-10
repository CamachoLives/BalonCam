package com.baloncam.features.reserva.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record BloqueoResponseDTO(
    String token,
    LocalDateTime expiresAt,
    int duracionMinutos,
    Long canchaId,
    LocalDate fecha,
    LocalTime horaInicio
) {}
