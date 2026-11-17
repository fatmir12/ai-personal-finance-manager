package com.aifinance.backend.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RecurringTransactionRequestTest {

    @Test
    void acceptsTheFrequenciesSupportedByTheScheduler() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();

            assertTrue(validator.validate(requestWithFrequency("DAILY")).isEmpty());
            assertTrue(validator.validate(requestWithFrequency("WEEKLY")).isEmpty());
            assertTrue(validator.validate(requestWithFrequency("MONTHLY")).isEmpty());
            assertFalse(validator.validate(requestWithFrequency("DAILI")).isEmpty());
        }
    }

    private RecurringTransactionRequest requestWithFrequency(String frequency) {
        return new RecurringTransactionRequest(
                1L,
                1L,
                new BigDecimal("25.00"),
                "Mjesečna pretplata",
                frequency,
                LocalDate.of(2026, 11, 18),
                true
        );
    }
}
