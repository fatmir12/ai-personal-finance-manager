package com.aifinance.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Ime je obavezno")
        String firstName,

        @NotBlank(message = "Prezime je obavezno")
        String lastName,

        @NotBlank(message = "Email je obavezan")
        @Email(message = "Email nije ispravan")
        String email,

        @NotBlank(message = "Lozinka je obavezna")
        @Size(min=8, message = "Lozinka mora imati najmanje 6 karaktera")
        String password
) {

}
