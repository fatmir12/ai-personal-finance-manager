package com.aifinance.backend.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record AccountRequest(
        @NotBlank(message = "Naziv računa je obavezan")
        @Size(max = 100,message = "Naziv može imati najviše 100 znakova")
        String name,

        @NotBlank(message = "Tip računa je oavezan")
        @Pattern(
                regexp = "CASH|BANK|SAVINGS",
                message = "Tip mora biti CASH,BANK ili SAVINGS"
        )
        String type,

        @NotNull(message = "Početno stanje je obavezno")
        @Digits(integer = 10, fraction = 2)
        BigDecimal initialBalance
) {
}
