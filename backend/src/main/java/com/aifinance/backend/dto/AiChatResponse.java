
package com.aifinance.backend.dto;

public record AiChatResponse(
        AiMessageResponse message,
        AiFinancialResponse financialData
) {
}
