
package com.aifinance.backend.service;

import com.aifinance.backend.dto.AiFinancialResponse;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class AiFinancialAnswerService {

    public String generateSavingGoalAnswer(
            AiFinancialResponse data
    ) {

        String goalName = data.name();

        BigDecimal targetAmount = data.targetAmount();
        BigDecimal currentAmount = data.currentAmount();
        BigDecimal remainingAmount = data.remainingAmount();
        BigDecimal progress = data.progressPercentage();

        boolean completed =
                currentAmount.compareTo(targetAmount) >= 0;

        if (completed) {

            return String.format(
                    "Za cilj „%s“ trenutno je ušteđeno %s " +
                            "od planiranih %s. " +
                            "Napredak iznosi %s%%, a cilj je ostvaren.",
                    goalName,
                    currentAmount.toPlainString(),
                    targetAmount.toPlainString(),
                    progress.stripTrailingZeros().toPlainString()
            );
        }

        return String.format(
                "Za cilj „%s“ trenutno je ušteđeno %s " +
                        "od planiranih %s. " +
                        "Napredak iznosi %s%%. " +
                        "Za ostvarenje cilja nedostaje još %s.",
                goalName,
                currentAmount.toPlainString(),
                targetAmount.toPlainString(),
                progress.stripTrailingZeros().toPlainString(),
                remainingAmount.toPlainString()
        );
    }
}
