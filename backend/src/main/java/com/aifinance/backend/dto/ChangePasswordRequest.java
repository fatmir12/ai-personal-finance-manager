package com.aifinance.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Trenutna lozinka je obavezna")
        String currentPassword,

        @NotBlank(message = "Nova lozinka je obavezna")
        @Size(min = 8, message = "Nova lozinka mora imati najmanje 8 karaktera")
        String newPassword
) {
}
