package com.baloncam.features.reserva.controller;

import com.baloncam.features.reserva.dto.*;
import com.baloncam.features.reserva.service.ReservaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservas")
@RequiredArgsConstructor
public class ReservaController {

    private final ReservaService reservaService;

    /** Paso 1: bloquear el slot y obtener token */
    @PostMapping("/bloquear")
    public ResponseEntity<BloqueoResponseDTO> bloquear(@Valid @RequestBody BloquearSlotRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reservaService.bloquearSlot(req));
    }

    /** Paso 2: confirmar la reserva con datos del cliente */
    @PostMapping("/confirmar")
    public ResponseEntity<ReservaDTO> confirmar(@Valid @RequestBody ConfirmarReservaRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reservaService.confirmarReserva(req));
    }

    /** Consultar reserva por token */
    @GetMapping("/{token}")
    public ResponseEntity<ReservaDTO> obtener(@PathVariable String token) {
        return ResponseEntity.ok(reservaService.obtenerPorToken(token));
    }

    /** Cancelar reserva */
    @DeleteMapping("/{token}")
    public ResponseEntity<Void> cancelar(@PathVariable String token) {
        reservaService.cancelarReserva(token);
        return ResponseEntity.noContent().build();
    }
}
