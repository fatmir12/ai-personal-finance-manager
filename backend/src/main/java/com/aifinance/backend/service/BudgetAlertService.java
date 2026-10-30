package com.aifinance.backend.service;

import com.aifinance.backend.entity.Budget;
import com.aifinance.backend.entity.Transaction;
import com.aifinance.backend.repository.BudgetRepository;
import com.aifinance.backend.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
public class BudgetAlertService {
    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationService notificationService;

    public BudgetAlertService(BudgetRepository budgetRepository, TransactionRepository transactionRepository, NotificationService notificationService) {
        this.budgetRepository = budgetRepository;
        this.transactionRepository = transactionRepository;
        this.notificationService = notificationService;
    }
    @Transactional
    public void checkAfterExpenseCreated(Transaction transaction) {
        if(!"EXPENSE".equals(transaction.getCategory().getType())){
            return;
        }
        Long userId = transaction.getUser().getId();
        Long categoryId = transaction.getCategory().getId();

        LocalDate date=transaction.getTransactionDate();

        int month=date.getMonthValue();
        int year=date.getYear();

        Budget budget=budgetRepository
                .findByUser_IdAndCategory_IdAndMonthAndYear(
                        userId,
                        categoryId,
                        month,
                        year
                ).orElse(null);

        if(budget==null){
            return;
        }

        LocalDate startDate=date.withDayOfMonth(1);
        LocalDate endDate=startDate.plusMonths(1);

        BigDecimal currentSpent=transactionRepository
                .sumExpensesByCategoryAndPeriod(
                        userId,
                        categoryId,
                        startDate,
                        endDate
                );

        if(currentSpent == null){
            currentSpent=BigDecimal.ZERO;
        }

        BigDecimal previousSpent=currentSpent.subtract(
                transaction.getAmount()
        );

        BigDecimal limit=budget.getAmountLimit();

        boolean wasWithinLimit=previousSpent.compareTo(limit)<=0;
        boolean isOverLimit=currentSpent.compareTo(limit)>0;

        if(wasWithinLimit && isOverLimit){
            String message=
                    "Potrošnja za kategoriju "
                    + transaction.getCategory().getName()
                    + " iznosi "
                    + currentSpent
                    + " KM i premašila je budžet od "
                    + limit
                    + " KM za "
                    + month + "/" + year + ".";

            notificationService.createNotification(
                    transaction.getUser(),
                    "Prekoračen budžet",
                    message,
                    "BUDGET_ALERT"
            );
        }
    }

    @Transactional
    public void checkAfterExpenseUpdated(
            Transaction transaction,
            BigDecimal previousAmount,
            Long previousCategoryId,
            LocalDate previousDate,
            String previousCategoryType
    ){
        if(!"EXPENSE".equals(transaction.getCategory().getType())){
            return;
        }
        Long userId = transaction.getUser().getId();
        Long categoryId = transaction.getCategory().getId();

        LocalDate date=transaction.getTransactionDate();
        int month=date.getMonthValue();
        int year=date.getYear();

        Budget budget=budgetRepository
                .findByUser_IdAndCategory_IdAndMonthAndYear(
                        userId,categoryId,month,year
                ).orElse(null);

        if(budget==null){
            return;
        }

        LocalDate startDate=date.withDayOfMonth(1);
        LocalDate endDate=startDate.plusMonths(1);

        BigDecimal currentSpent=transactionRepository
                .sumExpensesByCategoryAndPeriod(
                        userId,categoryId,startDate,endDate
                );
        if(currentSpent == null){
            currentSpent=BigDecimal.ZERO;
        }

        boolean sameCategoryAndMonth="EXPENSE".equals(previousCategoryType)&&categoryId.equals(previousCategoryId) && previousDate.getYear()==year && previousDate.getMonthValue()==month;

        BigDecimal previousSpent;

        if(sameCategoryAndMonth){
            previousSpent=currentSpent
                    .subtract(transaction.getAmount())
                    .add(previousAmount);
        }else{
            previousSpent=currentSpent.subtract(transaction.getAmount());
        }

        BigDecimal limit=budget.getAmountLimit();
        if(previousSpent.compareTo(limit)<=0 && currentSpent.compareTo(limit)>0){
            String message=
                    "Potrošnja za kategoriju "
                    + transaction.getCategory().getName()
                    +" iznosi "+ currentSpent
                    +" KM i premašila je budžet od "
                    + limit + " KM za "
                    + month + "/" + year + ".";
            notificationService.createNotification(
                    transaction.getUser(),
                    "Prekoračen budžet",
                    message,
                    "BUDGET_ALERT"
            );
        }
    }

    @Transactional
    public void lockBudgetForExpense(
            Long userId,
            Long categoryId,
            LocalDate transactionDate
    ){
        int month=transactionDate.getMonthValue();
        int year=transactionDate.getYear();

        budgetRepository.findByPeriodForUpdate(
                userId,categoryId,month,year
        );
    }


    @Transactional
    public void lockBudgetsForUpdate(
            Long userId,
            Long oldCategoryId,
            LocalDate oldDate,
            Long newCategoryId,
            LocalDate newDate
    ) {
        record BudgetKey(Long categoryId, int year, int month) {}

        BudgetKey oldKey = new BudgetKey(
                oldCategoryId,
                oldDate.getYear(),
                oldDate.getMonthValue()
        );

        BudgetKey newKey = new BudgetKey(
                newCategoryId,
                newDate.getYear(),
                newDate.getMonthValue()
        );

        java.util.List<BudgetKey> keys =
                java.util.stream.Stream.of(oldKey, newKey)
                        .distinct()
                        .sorted(
                                java.util.Comparator
                                        .comparing(BudgetKey::categoryId)
                                        .thenComparingInt(BudgetKey::year)
                                        .thenComparingInt(BudgetKey::month)
                        )
                        .toList();

        for (BudgetKey key : keys) {
            lockBudgetForExpense(
                    userId,
                    key.categoryId(),
                    LocalDate.of(key.year(), key.month(), 1)
            );
        }
    }

}
