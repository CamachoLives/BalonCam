package com.baloncam.features.reserva.service;

import com.baloncam.config.HorarioProperties;
import com.baloncam.features.cancha.entity.Cancha;
import com.baloncam.features.cancha.repository.CanchaRepository;
import com.baloncam.features.reserva.dto.*;
import com.baloncam.features.reserva.entity.BloqueoTemporal;
import com.baloncam.features.reserva.entity.EstadoReserva;
import com.baloncam.features.reserva.entity.Reserva;
import com.baloncam.features.reserva.repository.BloqueoTemporalRepository;
import com.baloncam.features.reserva.repository.ReservaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final BloqueoTemporalRepository bloqueoRepository;
    private final CanchaRepository canchaRepository;
    private final HorarioProperties horarioProps;

    @Value("${baloncam.bloqueo.duracion-minutos:5}")
    private int duracionBloqueoMinutos;

    /**
     * Devuelve la disponibilidad de todas las canchas para una fecha dada.
     * Cada slot tiene estado: DISPONIBLE, BLOQUEADO (en proceso de reserva), OCUPADO o NO_DISPONIBLE
     */
    @Transactional(readOnly = true)
    public List<DisponibilidadDTO> obtenerDisponibilidad(Long canchaId, LocalDate fecha) {
        Cancha cancha = canchaRepository.findById(canchaId)
                .orElseThrow(() -> new RuntimeException("Cancha no encontrada: " + canchaId));

        List<Reserva> reservas = reservaRepository.findReservasActivasPorCanchaYFecha(canchaId, fecha);
        LocalDateTime ahora = LocalDateTime.now();

        List<DisponibilidadDTO> slots = new ArrayList<>();
        int horaInicio = horarioProps.getHoraInicio();
        int horaFin = horarioProps.getHoraFin();

        for (int hora = horaInicio; hora < horaFin; hora++) {
            LocalTime slotInicio = LocalTime.of(hora % 24, 0);
            LocalTime slotFin = LocalTime.of((hora + 1) % 24, 0);

            String estado = calcularEstadoSlot(canchaId, fecha, slotInicio, reservas, ahora);

            slots.add(DisponibilidadDTO.builder()
                    .canchaId(canchaId)
                    .canchaNombre(cancha.getNombre())
                    .fecha(fecha)
                    .horaInicio(slotInicio)
                    .horaFin(slotFin == LocalTime.MIDNIGHT ? LocalTime.of(0, 0) : slotFin)
                    .estado(estado)
                    .precioPorHora(cancha.getPrecioPorHora())
                    .build());
        }
        return slots;
    }

    private String calcularEstadoSlot(Long canchaId, LocalDate fecha, LocalTime hora,
                                       List<Reserva> reservas, LocalDateTime ahora) {
        boolean ocupado = reservas.stream()
                .anyMatch(r -> r.getHoraInicio().equals(hora));
        if (ocupado) return "OCUPADO";

        boolean bloqueado = bloqueoRepository.existeBloqueoVigente(canchaId, fecha, hora, ahora);
        if (bloqueado) return "BLOQUEADO";

        // Slots pasados del día actual no están disponibles
        if (fecha.equals(LocalDate.now()) && hora.isBefore(LocalTime.now())) {
            return "PASADO";
        }

        return "DISPONIBLE";
    }

    /**
     * Intenta bloquear un slot. Si ya está tomado, lanza excepción.
     * Devuelve un token único válido por duracionBloqueoMinutos.
     * Sincronizado para evitar race conditions.
     */
    @Transactional
    public synchronized BloqueoResponseDTO bloquearSlot(BloquearSlotRequest req) {
        LocalDateTime ahora = LocalDateTime.now();

        // Verificar que no hay reserva activa
        boolean reservaActiva = reservaRepository.existeReservaActiva(
                req.getCanchaId(), req.getFecha(), req.getHoraInicio());
        if (reservaActiva) {
            throw new SlotNoDisponibleException("Este horario ya fue reservado. Elige otro.");
        }

        // Verificar que no hay bloqueo vigente
        boolean bloqueado = bloqueoRepository.existeBloqueoVigente(
                req.getCanchaId(), req.getFecha(), req.getHoraInicio(), ahora);
        if (bloqueado) {
            throw new SlotNoDisponibleException("Alguien más está completando esta reserva. Intenta en unos minutos.");
        }

        Cancha cancha = canchaRepository.findById(req.getCanchaId())
                .orElseThrow(() -> new RuntimeException("Cancha no encontrada"));

        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 32);
        LocalDateTime expira = ahora.plusMinutes(duracionBloqueoMinutos);

        BloqueoTemporal bloqueo = BloqueoTemporal.builder()
                .cancha(cancha)
                .fecha(req.getFecha())
                .horaInicio(req.getHoraInicio())
                .token(token)
                .expiresAt(expira)
                .build();

        bloqueoRepository.save(bloqueo);

        return BloqueoResponseDTO.builder()
                .token(token)
                .expiresAt(expira)
                .duracionMinutos(duracionBloqueoMinutos)
                .canchaId(req.getCanchaId())
                .fecha(req.getFecha())
                .horaInicio(req.getHoraInicio())
                .build();
    }

    /**
     * Confirma una reserva usando el token obtenido en bloquearSlot.
     */
    @Transactional
    public ReservaDTO confirmarReserva(ConfirmarReservaRequest req) {
        BloqueoTemporal bloqueo = bloqueoRepository.findByToken(req.getToken())
                .orElseThrow(() -> new TokenInvalidoException("Token inválido o no encontrado."));

        if (!bloqueo.estaVigente()) {
            bloqueoRepository.delete(bloqueo);
            throw new TokenInvalidoException("El tiempo para confirmar expiró. Inicia el proceso nuevamente.");
        }

        // Doble verificación de disponibilidad
        boolean reservaActiva = reservaRepository.existeReservaActiva(
                bloqueo.getCancha().getId(), bloqueo.getFecha(), bloqueo.getHoraInicio());
        if (reservaActiva) {
            bloqueoRepository.delete(bloqueo);
            throw new SlotNoDisponibleException("Este horario ya fue reservado mientras completabas el formulario.");
        }

        String reservaToken = UUID.randomUUID().toString().replace("-", "").substring(0, 24);

        Reserva reserva = Reserva.builder()
                .cancha(bloqueo.getCancha())
                .fecha(bloqueo.getFecha())
                .horaInicio(bloqueo.getHoraInicio())
                .horaFin(bloqueo.getHoraInicio().plusHours(1))
                .estado(EstadoReserva.CONFIRMADA)
                .token(reservaToken)
                .clienteNombre(req.getNombre())
                .clienteTelefono(req.getTelefono())
                .clienteEmail(req.getEmail())
                .confirmadaAt(LocalDateTime.now())
                .build();

        reservaRepository.save(reserva);
        bloqueoRepository.delete(bloqueo);

        return mapToDTO(reserva);
    }

    @Transactional(readOnly = true)
    public ReservaDTO obtenerPorToken(String token) {
        Reserva reserva = reservaRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada."));
        return mapToDTO(reserva);
    }

    @Transactional
    public void cancelarReserva(String token) {
        Reserva reserva = reservaRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada."));
        reserva.setEstado(EstadoReserva.CANCELADA);
        reservaRepository.save(reserva);
    }

    /** Limpieza automática de bloqueos expirados cada minuto */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void limpiarBloqueosExpirados() {
        int eliminados = bloqueoRepository.eliminarBloqueoExpirados(LocalDateTime.now());
        if (eliminados > 0) {
            System.out.println("Bloqueos expirados eliminados: " + eliminados);
        }
    }

    private ReservaDTO mapToDTO(Reserva r) {
        return ReservaDTO.builder()
                .id(r.getId())
                .token(r.getToken())
                .canchaId(r.getCancha().getId())
                .canchaNombre(r.getCancha().getNombre())
                .fecha(r.getFecha())
                .horaInicio(r.getHoraInicio())
                .horaFin(r.getHoraFin())
                .estado(r.getEstado().name())
                .clienteNombre(r.getClienteNombre())
                .clienteTelefono(r.getClienteTelefono())
                .clienteEmail(r.getClienteEmail())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
