
package com.aifinance.backend.service;

import com.aifinance.backend.dto.AiFinancialResponse;
import com.aifinance.backend.dto.SavingGoalResponse;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

@Service
public class AiFinancialDataService {

    private final SavingGoalService savingGoalService;

    public AiFinancialDataService(
            SavingGoalService savingGoalService
    ) {
        this.savingGoalService = savingGoalService;
    }

    public AiFinancialResponse getSavingGoalData(
            Long goalId,
            Long userId
    ) {

        // 1. Dohvatanje ciljeva prijavljenog korisnika
        SavingGoalResponse goal = savingGoalService
                .getSavingGoalsForUser(userId)
                .stream()
                .filter(item -> item.id().equals(goalId))
                .findFirst()
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Cilj štednje nije pronađen"
                        )
                );

        // 2. Određivanje statusa cilja
        String status = goal.currentAmount()
                .compareTo(goal.targetAmount()) >= 0
                ? "OSTVAREN"
                : "U TOKU";

        // 3. Kreiranje strukturiranog odgovora
        return new AiFinancialResponse(
                "SAVING_GOAL",
                goal.name(),
                goal.targetAmount(),
                goal.currentAmount(),
                goal.remainingAmount(),
                goal.progressPercentage(),
                status,
                goal.targetDate()
        );
    }
}
