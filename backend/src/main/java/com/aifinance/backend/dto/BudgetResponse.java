package com.aifinance.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BudgetResponse(
        Long id,
        Long categoryId,
        String CategoryName,
        BigDecimal amountLimit,
        BigDecimal spentAmount,
        BigDecimal remainingAmount,
        Integer month,
        Integer year,
        LocalDateTime createdAt
) {
}
