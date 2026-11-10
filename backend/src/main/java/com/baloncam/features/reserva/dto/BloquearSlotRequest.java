package com.baloncam.features.reserva.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class BloquearSlotRequest {
    @NotNull
    private Long canchaId;

    @NotNull
    @Future
    private LocalDate fecha;

    @NotNull
    private LocalTime horaInicio;
}
