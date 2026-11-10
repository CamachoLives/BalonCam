package com.baloncam.features.reserva.service;

public class SlotNoDisponibleException extends RuntimeException {
    public SlotNoDisponibleException(String message) {
        super(message);
    }
}
