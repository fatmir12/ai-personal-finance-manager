package com.aifinance.backend.service;

import com.aifinance.backend.entity.RecurringTransaction;
import com.aifinance.backend.repository.RecurringTransactionRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Component
@ConditionalOnProperty(name = "app.recurring.scheduler-enabled", havingValue = "true")
public class RecurringTransactionScheduler {
    private final RecurringTransactionRepository recurringRepository;
    private final RecurringTransactionsExecutionService executionService;

    public RecurringTransactionScheduler(RecurringTransactionRepository recurringRepository, RecurringTransactionsExecutionService executionService) {
        this.recurringRepository = recurringRepository;
        this.executionService = executionService;
    }
    @Scheduled(fixedDelay = 60000, initialDelay = 60000)
    public void processRecurringTransactions() {
        System.out.println("SCHEDULER POKRENUT!");
        LocalDate today=LocalDate.now(
                ZoneId.of("Europe/Sarajevo")
        );
        List<RecurringTransaction> dueRules=recurringRepository
                .findByActiveTrueAndNextRunDateLessThanEqual(today);
        System.out.println("Broj dospjelih pravila: " + dueRules.size());

        for(RecurringTransaction rule:dueRules){
            try{
                System.out.println("Izvrsavam pravilo ID: " + rule.getId());
                executionService.executeRule(rule.getId(),today);
            }catch(Exception e){
                System.err.println("Greška pri izvršavanju pravila ID" + rule.getId()+ ": "+ e.getMessage());
            }
        }
    }
}
