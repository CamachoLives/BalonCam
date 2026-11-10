package com.baloncam.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "baloncam.horario")
public class HorarioProperties {
    private int horaInicio = 7;
    private int horaFin = 24;
    private int duracionSlotMinutos = 60;
}
