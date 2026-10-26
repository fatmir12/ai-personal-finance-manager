package com.aifinance.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequest(
        @NotBlank(message = "Refresh token je obavezan")
        String refreshToken
) {
}
