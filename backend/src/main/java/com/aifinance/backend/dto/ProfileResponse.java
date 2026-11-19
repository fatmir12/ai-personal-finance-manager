package com.aifinance.backend.dto;

import java.time.LocalDateTime;

public record ProfileResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        LocalDateTime createdAt
) {
}
