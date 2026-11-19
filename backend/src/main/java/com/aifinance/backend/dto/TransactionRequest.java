package com.aifinance.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionRequest(
        @NotNull(message = "Kategorija je obavezna")
        Long categoryId,

        @NotNull(message = "Finansijski račun je obavetan")
        Long accountId,

        @NotNull(message = "Iznos je obavezan")
        @DecimalMin(
                value = "0.01",
                message = "Iznos mora biti veći od nule"
        )
        @Digits(
                integer = 8,
                fraction = 2,
                message = "Iznos može imati najviše 8 cifara prije i 2 iza decimalne tačke"
        )
        BigDecimal amount,

        @Size(
                max=500,
                message = "Opis može imati najviše 500 karaktera"
        )
        String description,

        @NotNull(message = "Datum transakcije je obavezan")
        LocalDate transactionDate

) {

}
