package com.aifinance.backend.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SavingGoalRequest(
        @NotBlank(message = "Naziv cilja je obavezan")
        @Size(
                max = 100,
                message = "Naziv može imati najviše 100 znakova"
        )
        String name,

        @NotNull(message = "Ciljani izno je obavezan")
        @DecimalMin(
                value = "0.01",
                message = "Ciljani iznos mora biti veći od nule"
        )
        @Digits(
                integer = 8,
                fraction = 2,
                message = "Iznos može imati najviše 8 cifara prije i 2 iza decimalne tačke"
        )
        BigDecimal targetAmount,

        @NotNull(message = "Trenutno ušteđeni iznos je obavezan")
        @DecimalMin(
                value = "0.00",
                message = "Trenutno ušteđeni iznos ne može biti negativan"
        )
        @Digits(integer = 8, fraction = 2)
        BigDecimal currentAmount,

        LocalDate targetDate
) {
}
