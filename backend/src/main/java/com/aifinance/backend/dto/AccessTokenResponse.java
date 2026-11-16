
package com.aifinance.backend.dto;

public record AccessTokenResponse(
        String accessToken,
        String tokenType
) {
}
