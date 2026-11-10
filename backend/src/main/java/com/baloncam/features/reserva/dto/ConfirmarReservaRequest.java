package com.baloncam.features.reserva.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class ConfirmarReservaRequest {
    @NotBlank
    private String token;

    @NotBlank
    private String nombre;

    @NotBlank
    private String telefono;

    @Email
    private String email;

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
