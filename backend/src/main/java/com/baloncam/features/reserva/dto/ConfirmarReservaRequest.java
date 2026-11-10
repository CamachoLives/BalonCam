package com.baloncam.features.reserva.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ConfirmarReservaRequest {
    @NotBlank
    private String token;

    @NotBlank
    private String nombre;

    @NotBlank
    @Pattern(regexp = "^[+]?[(]?[0-9]{7,15}[)]?$", message = "Teléfono inválido")
    private String telefono;

    @Email
    private String email;
}
