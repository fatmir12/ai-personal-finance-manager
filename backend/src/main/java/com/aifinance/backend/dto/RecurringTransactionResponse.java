package com.aifinance.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record RecurringTransactionResponse(
        Long id,
        Long categoryId,
        String categoryName,
        String type,
        Long accountId,
        String accountName,
        BigDecimal amount,
        String description,
        String frequency,
        LocalDate nextRunDate,
        Boolean active,
        LocalDateTime createdAt
) {
}
