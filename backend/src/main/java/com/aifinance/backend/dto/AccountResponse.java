
package com.aifinance.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AccountResponse(
        Long id,
        String name,
        String type,
        BigDecimal initialBalance,
        BigDecimal currentBalance,
        LocalDateTime createdAt
) {
}
