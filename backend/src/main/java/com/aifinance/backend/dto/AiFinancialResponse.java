
package com.aifinance.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AiFinancialResponse(
        String type,
        String name,
        BigDecimal targetAmount,
        BigDecimal currentAmount,
        BigDecimal remainingAmount,
        BigDecimal progressPercentage,
        String status,
        LocalDate targetDate
) {
}
