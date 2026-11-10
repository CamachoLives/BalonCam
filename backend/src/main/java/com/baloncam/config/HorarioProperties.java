package com.baloncam.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "baloncam.horario")
public class HorarioProperties {
    private int horaInicio = 7;
    private int horaFin = 24;
    private int duracionSlotMinutos = 60;

    public int getHoraInicio() { return horaInicio; }
    public void setHoraInicio(int horaInicio) { this.horaInicio = horaInicio; }
    public int getHoraFin() { return horaFin; }
    public void setHoraFin(int horaFin) { this.horaFin = horaFin; }
    public int getDuracionSlotMinutos() { return duracionSlotMinutos; }
    public void setDuracionSlotMinutos(int duracionSlotMinutos) { this.duracionSlotMinutos = duracionSlotMinutos; }
}
