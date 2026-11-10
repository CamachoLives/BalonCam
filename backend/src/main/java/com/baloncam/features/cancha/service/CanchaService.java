package com.baloncam.features.cancha.service;

import com.baloncam.features.cancha.entity.Cancha;
import com.baloncam.features.cancha.entity.EstadoCancha;
import com.baloncam.features.cancha.repository.CanchaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CanchaService {

    private final CanchaRepository canchaRepository;

    public CanchaService(CanchaRepository canchaRepository) {
        this.canchaRepository = canchaRepository;
    }

    public List<Cancha> listarTodas() {
        return canchaRepository.findByEstadoOrderByOrdenVisualAsc(EstadoCancha.ACTIVA);
    }

    public List<Cancha> listarPrincipales() {
        return canchaRepository.findCanchasPrincipales();
    }

    public List<Cancha> listarSubcanchas(Long padreId) {
        return canchaRepository.findSubcanchasByPadreId(padreId);
    }

    public Cancha obtenerPorId(Long id) {
        return canchaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cancha no encontrada: " + id));
    }
}
