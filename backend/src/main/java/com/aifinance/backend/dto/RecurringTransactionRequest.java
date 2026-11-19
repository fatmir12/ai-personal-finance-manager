package com.aifinance.backend.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RecurringTransactionRequest(
        @NotNull(message = "Kategorija je obavezna")
        Long categoryId,
        @NotNull(message = "Račun je obavezan")
        Long accountId,
        @NotNull(message = "Iznos je obavezan")
        @DecimalMin(
                value = "0.01",
                message = "Iznos mora biti veći od nule"
        )
        @Digits(integer = 8,fraction = 2)
        BigDecimal amount,

        @Size(max = 255)
        String description,

        @NotBlank(message = "Učestalost je obavezna")
        @Pattern(
                regexp = "DAILY|WEEKLY|MONTHLY",
                message = "Učestalost mora biti DAILY,WEEKLY ili MONTHLY"
        )
        String frequency,

        @NotNull(message = "Datum sljedećeg izvršavanja je obavezan")
        LocalDate nextRunDate,
        @NotNull(message = "Status aktivnosti je obavezan")
        Boolean active
) {
}
