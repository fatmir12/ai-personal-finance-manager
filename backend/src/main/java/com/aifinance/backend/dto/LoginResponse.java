package com.aifinance.backend.dto;

public record LoginResponse(String accessToken,String refreshToken,String tokenType) {

}
