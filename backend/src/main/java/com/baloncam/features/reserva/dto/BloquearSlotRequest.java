package com.baloncam.features.reserva.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public class BloquearSlotRequest {
    @NotNull
    private Long canchaId;

    @NotNull
    private LocalDate fecha;

    @NotNull
    private LocalTime horaInicio;

    public Long getCanchaId() { return canchaId; }
    public void setCanchaId(Long canchaId) { this.canchaId = canchaId; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public LocalTime getHoraInicio() { return horaInicio; }
    public void setHoraInicio(LocalTime horaInicio) { this.horaInicio = horaInicio; }
}
