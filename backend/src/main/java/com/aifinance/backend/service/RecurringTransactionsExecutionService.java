
package com.aifinance.backend.service;

import com.aifinance.backend.entity.RecurringTransaction;
import com.aifinance.backend.entity.Transaction;
import com.aifinance.backend.repository.RecurringTransactionRepository;
import com.aifinance.backend.repository.TransactionRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Service
public class RecurringTransactionsExecutionService {

    private final RecurringTransactionRepository recurringRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationService notificationService;
    private final BudgetAlertService budgetAlertService;

    public RecurringTransactionsExecutionService(
            RecurringTransactionRepository recurringRepository,
            TransactionRepository transactionRepository,
            NotificationService notificationService,
            BudgetAlertService budgetAlertService
    ) {
        this.recurringRepository = recurringRepository;
        this.transactionRepository = transactionRepository;
        this.notificationService = notificationService;
        this.budgetAlertService = budgetAlertService;
    }


    @Transactional
    public void executeRule(Long recurringId, LocalDate today) {
        executeInternal(recurringId, null, today);
    }


    @Transactional
    public void executeRuleForUser(
            Long recurringId,
            Long userId,
            LocalDate today
    ) {
        executeInternal(recurringId, userId, today);
    }


    private void executeInternal(
            Long recurringId,
            Long userId,
            LocalDate today
    ) {


        RecurringTransaction rule = recurringRepository
                .findByIdForUpdate(recurringId)
                .orElse(null);


        if (rule == null) {
            if (userId != null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Ponavljajuća transakcija nije pronađena"
                );
            }
            return;
        }


        if (userId != null && rule.getUser().getId() != userId) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Ponavljajuća transakcija nije pronađena"
            );
        }


        if (!rule.isActive()
                || rule.getNextRunDate().isAfter(today)) {
            return;
        }


        LocalDate dueDate = rule.getNextRunDate();


        Transaction transaction = new Transaction();

        transaction.setUser(rule.getUser());
        transaction.setCategory(rule.getCategory());
        transaction.setAccount(rule.getAccount());
        transaction.setAmount(rule.getAmount());
        transaction.setDescription(rule.getDescription());
        transaction.setTransactionDate(dueDate);
        transaction.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));


        transaction.setRecurringRuleId(rule.getId());
        transaction.setRecurringDueDate(dueDate);

        if("EXPENSE".equals(rule.getCategory().getType())){
            budgetAlertService.lockBudgetForExpense(
                    rule.getUser().getId(),
                    rule.getCategory().getId(),
                    dueDate
            );
        }


        Transaction savedTransaction = transactionRepository.save(transaction);
        transactionRepository.flush();
        budgetAlertService.checkAfterExpenseCreated(savedTransaction);


        LocalDate nextDate = switch (rule.getFrequency()) {
            case "DAILY" -> dueDate.plusDays(1);
            case "WEEKLY" -> dueDate.plusWeeks(1);
            case "MONTHLY" -> dueDate.plusMonths(1);
            default -> throw new IllegalStateException(
                    "Nepoznata učestalost: " + rule.getFrequency()
            );
        };


        rule.setNextRunDate(nextDate);


        recurringRepository.save(rule);

        String notificationMessage="Automatski je evidentirana transakcija od "
                + rule.getAmount()
                + "KM. Opis: "
                + rule.getDescription();

        notificationService.createNotification(
                rule.getUser(),
                "Ponavljajuća transakcija izvršena",
                notificationMessage,
                "RECURRING_TRANSACTION"
        );
    }
}
