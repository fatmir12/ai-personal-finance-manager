
package com.aifinance.backend.controller;

import com.aifinance.backend.dto.AiFinancialResponse;
import com.aifinance.backend.service.AiFinancialDataService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/financial")
public class AiFinancialController {

    private final AiFinancialDataService financialDataService;

    public AiFinancialController(
            AiFinancialDataService financialDataService
    ) {
        this.financialDataService = financialDataService;
    }

    @GetMapping("/saving-goals/{goalId}")
    public ResponseEntity<AiFinancialResponse> getSavingGoalData(
            @PathVariable Long goalId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        // ID prijavljenog korisnika iz validiranog JWT tokena
        Long userId = Long.valueOf(jwt.getSubject());

        AiFinancialResponse response =
                financialDataService.getSavingGoalData(
                        goalId,
                        userId
                );

        return ResponseEntity.ok(response);
    }
}
