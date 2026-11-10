package com.baloncam.features.cancha.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "canchas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cancha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 255)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoCancha tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoCancha estado = EstadoCancha.ACTIVA;

    @Column(name = "precio_por_hora", nullable = false)
    private Double precioPorHora;

    // Posición visual en el mapa de canchas (para el frontend)
    @Column(name = "posicion_x")
    private Integer posicionX;

    @Column(name = "posicion_y")
    private Integer posicionY;

    // Si es subcampo, referencia al campo padre (cancha grande)
    @ManyToOne
    @JoinColumn(name = "cancha_padre_id")
    private Cancha canchaPadre;

    @Column(name = "orden_visual")
    private Integer ordenVisual;
}
