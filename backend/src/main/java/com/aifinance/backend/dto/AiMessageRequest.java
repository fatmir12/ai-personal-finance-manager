package com.aifinance.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiMessageRequest(
        @NotBlank(message = "Sadržaj poruke je obavezan")
        @Size(max=10000, message = "Poruka može imati najviše 10000 znakova")
        String content
) {

}
