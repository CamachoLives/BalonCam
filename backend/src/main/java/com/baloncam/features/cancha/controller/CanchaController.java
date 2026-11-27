package com.baloncam.features.cancha.controller;

import com.baloncam.features.cancha.entity.Cancha;
import com.baloncam.features.cancha.service.CanchaService;
import com.baloncam.features.reserva.dto.DisponibilidadDTO;
import com.baloncam.features.reserva.service.ReservaService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/canchas")
public class CanchaController {

    private final CanchaService canchaService;
    private final ReservaService reservaService;

    public CanchaController(CanchaService canchaService, ReservaService reservaService) {
        this.canchaService = canchaService;
        this.reservaService = reservaService;
    }

    @GetMapping
    public ResponseEntity<List<Cancha>> listarTodas() {
        return ResponseEntity.ok(canchaService.listarTodas());
    }

    @GetMapping("/principales")
    public ResponseEntity<List<Cancha>> listarPrincipales() {
        return ResponseEntity.ok(canchaService.listarPrincipales());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cancha> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(canchaService.obtenerPorId(id));
    }

    @GetMapping("/{id}/disponibilidad")
    public ResponseEntity<List<DisponibilidadDTO>> disponibilidad(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(reservaService.obtenerDisponibilidad(id, fecha));
    }

    @GetMapping("/disponibilidad")
    public ResponseEntity<Map<Long, List<DisponibilidadDTO>>> disponibilidadTodas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        List<Cancha> canchas = canchaService.listarTodas();
        Map<Long, List<DisponibilidadDTO>> resultado = new java.util.LinkedHashMap<>();
        for (Cancha c : canchas) {
            resultado.put(c.getId(), reservaService.obtenerDisponibilidad(c.getId(), fecha));
        }
        return ResponseEntity.ok(resultado);
    }
}
