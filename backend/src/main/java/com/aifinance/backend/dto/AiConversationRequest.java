package com.aifinance.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiConversationRequest(
        @NotBlank(message = "Naslov razgovora je obavezan")
        @Size(max = 150,message = "Naslov možte imati najviše 150 znakova")
        String title
) {

}
