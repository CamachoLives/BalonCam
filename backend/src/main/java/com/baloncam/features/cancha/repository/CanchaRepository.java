package com.baloncam.features.cancha.repository;

import com.baloncam.features.cancha.entity.Cancha;
import com.baloncam.features.cancha.entity.EstadoCancha;
import com.baloncam.features.cancha.entity.TipoCancha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CanchaRepository extends JpaRepository<Cancha, Long> {

    List<Cancha> findByEstadoOrderByOrdenVisualAsc(EstadoCancha estado);

    List<Cancha> findByTipoAndEstadoOrderByOrdenVisualAsc(TipoCancha tipo, EstadoCancha estado);

    @Query("SELECT c FROM Cancha c WHERE c.canchaPadre IS NULL ORDER BY c.ordenVisual ASC")
    List<Cancha> findCanchasPrincipales();

    @Query("SELECT c FROM Cancha c WHERE c.canchaPadre.id = :padreId ORDER BY c.ordenVisual ASC")
    List<Cancha> findSubcanchasByPadreId(Long padreId);
}
