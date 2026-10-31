package com.aifinance.backend.dto;

import java.time.LocalDateTime;

public record AiConversationResponse(
        Long id,
        String title,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
