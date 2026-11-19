package com.aifinance.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank(message = "Naziv kategorije je obavezan")
        @Size(max = 100,message = "Naziv može imati najviše 100 karaktera")
        String name,

        @NotBlank(message = "Tip kategorije je obavezan")
        @Pattern(
                regexp = "INCOME|EXPENSE",
                message = "Tip mora biti INCOME ili EXPENSE"
        )
        String type
) {
}
