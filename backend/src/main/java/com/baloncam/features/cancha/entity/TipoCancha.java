package com.baloncam.features.cancha.entity;

public enum TipoCancha {
    FUTBOL_11("Fútbol 11", 22),
    FUTBOL_10("Fútbol 10", 20),
    FUTBOL_5("Fútbol 5", 10);

    private final String descripcion;
    private final int jugadoresMax;

    TipoCancha(String descripcion, int jugadoresMax) {
        this.descripcion = descripcion;
        this.jugadoresMax = jugadoresMax;
    }

    public String getDescripcion() { return descripcion; }
    public int getJugadoresMax() { return jugadoresMax; }
}
