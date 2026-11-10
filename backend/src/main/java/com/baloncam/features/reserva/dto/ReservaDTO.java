package com.baloncam.features.reserva.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record ReservaDTO(
    Long id,
    String token,
    Long canchaId,
    String canchaNombre,
    LocalDate fecha,
    LocalTime horaInicio,
    LocalTime horaFin,
    String estado,
    String clienteNombre,
    String clienteTelefono,
    String clienteEmail,
    LocalDateTime createdAt
) {}
