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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final BloqueoTemporalRepository bloqueoRepository;
    private final CanchaRepository canchaRepository;
    private final HorarioProperties horarioProps;

    @Value("${baloncam.bloqueo.duracion-minutos:5}")
    private int duracionBloqueoMinutos;

    public ReservaService(ReservaRepository reservaRepository,
                          BloqueoTemporalRepository bloqueoRepository,
                          CanchaRepository canchaRepository,
                          HorarioProperties horarioProps) {
        this.reservaRepository = reservaRepository;
        this.bloqueoRepository = bloqueoRepository;
        this.canchaRepository = canchaRepository;
        this.horarioProps = horarioProps;
    }

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
            LocalTime slotFin = (hora + 1 >= 24) ? LocalTime.MIDNIGHT : LocalTime.of(hora + 1, 0);
            String estado = calcularEstadoSlot(canchaId, fecha, slotInicio, reservas, ahora);

            slots.add(new DisponibilidadDTO(
                canchaId, cancha.getNombre(), fecha, slotInicio, slotFin, estado, cancha.getPrecioPorHora()
            ));
        }
        return slots;
    }

    private String calcularEstadoSlot(Long canchaId, LocalDate fecha, LocalTime hora,
                                       List<Reserva> reservas, LocalDateTime ahora) {
        boolean ocupado = reservas.stream().anyMatch(r -> r.getHoraInicio().equals(hora));
        if (ocupado) return "OCUPADO";

        boolean bloqueado = bloqueoRepository.existeBloqueoVigente(canchaId, fecha, hora, ahora);
        if (bloqueado) return "BLOQUEADO";

        if (fecha.equals(LocalDate.now()) && hora.isBefore(LocalTime.now())) return "PASADO";

        return "DISPONIBLE";
    }

    @Transactional
    public synchronized BloqueoResponseDTO bloquearSlot(BloquearSlotRequest req) {
        LocalDateTime ahora = LocalDateTime.now();

        boolean reservaActiva = reservaRepository.existeReservaActiva(
                req.getCanchaId(), req.getFecha(), req.getHoraInicio());
        if (reservaActiva) throw new SlotNoDisponibleException("Este horario ya fue reservado. Elige otro.");

        boolean bloqueado = bloqueoRepository.existeBloqueoVigente(
                req.getCanchaId(), req.getFecha(), req.getHoraInicio(), ahora);
        if (bloqueado) throw new SlotNoDisponibleException("Alguien más está completando esta reserva. Intenta en unos minutos.");

        Cancha cancha = canchaRepository.findById(req.getCanchaId())
                .orElseThrow(() -> new RuntimeException("Cancha no encontrada"));

        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 32);
        LocalDateTime expira = ahora.plusMinutes(duracionBloqueoMinutos);

        BloqueoTemporal bloqueo = new BloqueoTemporal();
        bloqueo.setCancha(cancha);
        bloqueo.setFecha(req.getFecha());
        bloqueo.setHoraInicio(req.getHoraInicio());
        bloqueo.setToken(token);
        bloqueo.setExpiresAt(expira);
        bloqueoRepository.save(bloqueo);

        return new BloqueoResponseDTO(token, expira, duracionBloqueoMinutos, req.getCanchaId(), req.getFecha(), req.getHoraInicio());
    }

    @Transactional
    public ReservaDTO confirmarReserva(ConfirmarReservaRequest req) {
        BloqueoTemporal bloqueo = bloqueoRepository.findByToken(req.getToken())
                .orElseThrow(() -> new TokenInvalidoException("Token inválido o no encontrado."));

        if (!bloqueo.estaVigente()) {
            bloqueoRepository.delete(bloqueo);
            throw new TokenInvalidoException("El tiempo para confirmar expiró. Inicia el proceso nuevamente.");
        }

        boolean reservaActiva = reservaRepository.existeReservaActiva(
                bloqueo.getCancha().getId(), bloqueo.getFecha(), bloqueo.getHoraInicio());
        if (reservaActiva) {
            bloqueoRepository.delete(bloqueo);
            throw new SlotNoDisponibleException("Este horario ya fue reservado mientras completabas el formulario.");
        }

        String reservaToken = UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        LocalTime horaFin = bloqueo.getHoraInicio().plusHours(1);

        Reserva reserva = new Reserva();
        reserva.setCancha(bloqueo.getCancha());
        reserva.setFecha(bloqueo.getFecha());
        reserva.setHoraInicio(bloqueo.getHoraInicio());
        reserva.setHoraFin(horaFin.equals(LocalTime.MIDNIGHT) ? LocalTime.of(0, 0) : horaFin);
        reserva.setEstado(EstadoReserva.CONFIRMADA);
        reserva.setToken(reservaToken);
        reserva.setClienteNombre(req.getNombre());
        reserva.setClienteTelefono(req.getTelefono());
        reserva.setClienteEmail(req.getEmail());
        reserva.setConfirmadaAt(LocalDateTime.now());
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

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void limpiarBloqueosExpirados() {
        int eliminados = bloqueoRepository.eliminarBloqueoExpirados(LocalDateTime.now());
        if (eliminados > 0) System.out.println("Bloqueos expirados eliminados: " + eliminados);
    }

    private ReservaDTO mapToDTO(Reserva r) {
        return new ReservaDTO(
            r.getId(), r.getToken(),
            r.getCancha().getId(), r.getCancha().getNombre(),
            r.getFecha(), r.getHoraInicio(), r.getHoraFin(),
            r.getEstado().name(),
            r.getClienteNombre(), r.getClienteTelefono(), r.getClienteEmail(),
            r.getCreatedAt()
        );
    }
}
