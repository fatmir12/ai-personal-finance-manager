package com.aifinance.backend.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record BudgetRequest(
        @NotNull(message = "Kategorija je obavezna")
        Long categoryId,

        @NotNull(message = "Limit budžeta je obavezan")
        @DecimalMin(
                value = "0.01",
                message = "Limit budžeta mora biti veći od nule"
        )
        @Digits(
                integer = 8,
                fraction = 2,
                message = "Limit može imati najviše 8 cifara prije i 2 iza decimalne tačke"
        )
        BigDecimal amountLimit,

        @NotNull(message = "Mjesec je obavezan")
        @Min(value = 1,message = "Mjesec mora biti između 1 i 12")
        @Max(value = 12,message = "Mjesec mora biti između 1 i 12")
        Integer month,

        @NotNull(message = "Godina je obavezna")
        @Min(value = 2000,message = "Godina mora biti najmanje 2000")
        @Max(value = 2100, message = "Godina može biti najviše 2100")
        Integer year
) {
}
