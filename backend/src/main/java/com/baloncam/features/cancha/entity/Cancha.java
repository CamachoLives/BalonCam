package com.baloncam.features.cancha.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "canchas")
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
    private EstadoCancha estado = EstadoCancha.ACTIVA;

    @Column(name = "precio_por_hora", nullable = false)
    private Double precioPorHora;

    @Column(name = "posicion_x")
    private Integer posicionX;

    @Column(name = "posicion_y")
    private Integer posicionY;

    @ManyToOne
    @JoinColumn(name = "cancha_padre_id")
    private Cancha canchaPadre;

    @Column(name = "orden_visual")
    private Integer ordenVisual;

    public Cancha() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public TipoCancha getTipo() { return tipo; }
    public void setTipo(TipoCancha tipo) { this.tipo = tipo; }

    public EstadoCancha getEstado() { return estado; }
    public void setEstado(EstadoCancha estado) { this.estado = estado; }

    public Double getPrecioPorHora() { return precioPorHora; }
    public void setPrecioPorHora(Double precioPorHora) { this.precioPorHora = precioPorHora; }

    public Integer getPosicionX() { return posicionX; }
    public void setPosicionX(Integer posicionX) { this.posicionX = posicionX; }

    public Integer getPosicionY() { return posicionY; }
    public void setPosicionY(Integer posicionY) { this.posicionY = posicionY; }

    public Cancha getCanchaPadre() { return canchaPadre; }
    public void setCanchaPadre(Cancha canchaPadre) { this.canchaPadre = canchaPadre; }

    public Integer getOrdenVisual() { return ordenVisual; }
    public void setOrdenVisual(Integer ordenVisual) { this.ordenVisual = ordenVisual; }
}
