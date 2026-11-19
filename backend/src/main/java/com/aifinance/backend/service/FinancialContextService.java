
package com.aifinance.backend.service;

import com.aifinance.backend.dto.AccountResponse;
import com.aifinance.backend.entity.Budget;
import com.aifinance.backend.entity.SavingGoal;
import com.aifinance.backend.repository.BudgetRepository;
import com.aifinance.backend.repository.SavingGoalRepository;
import com.aifinance.backend.repository.TransactionRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
public class FinancialContextService {
    private static final String[] BOSNIAN_MONTH_NAMES = {
            "januar", "februar", "mart", "april", "maj", "juni",
            "juli", "august", "septembar", "oktobar", "novembar", "decembar"
    };

    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final SavingGoalRepository savingGoalRepository;
    private final AccountService accountService;

    public FinancialContextService(
            TransactionRepository transactionRepository,
            BudgetRepository budgetRepository,
            SavingGoalRepository savingGoalRepository,
            AccountService accountService
    ) {
        this.transactionRepository = transactionRepository;
        this.budgetRepository = budgetRepository;
        this.savingGoalRepository = savingGoalRepository;
        this.accountService = accountService;
    }

    // 1. Kompletan mjesečni finansijski kontekst
    @Transactional(readOnly = true)
    public String getMonthlyFinancialContext(
            Long userId,
            YearMonth month
    ) {
        String monthLabel =
                "mjesec "
                        + BOSNIAN_MONTH_NAMES[month.getMonthValue() - 1]
                        + " "
                        + month.getYear();

        LocalDate startDate = month.atDay(1);
        LocalDate endDate = month.plusMonths(1).atDay(1);

        // Mjesečni prihodi i rashodi
        BigDecimal income = transactionRepository
                .sumIncomeByUserAndPeriod(
                        userId, startDate, endDate
                );

        BigDecimal expenses = transactionRepository
                .sumExpenseByUserAndPeriod(
                        userId, startDate, endDate
                );

        BigDecimal netAmount = income.subtract(expenses);

        // Rashodi po kategorijama
        List<Object[]> categoryExpenses = transactionRepository
                .findExpensesByCategoryAndPeriod(
                        userId, startDate, endDate
                );

        StringBuilder categorySummary = new StringBuilder();

        if (categoryExpenses.isEmpty()) {
            categorySummary.append(
                    "Nema evidentiranih rashoda po kategorijama.\n"
            );
        } else {
            for (Object[] row : categoryExpenses) {
                String categoryName = (String) row[0];
                BigDecimal amount = (BigDecimal) row[1];

                categorySummary
                        .append("- ")
                        .append(categoryName)
                        .append(": ")
                        .append(amount.toPlainString())
                        .append("\n");
            }
        }

        // Pojedinačne transakcije mjesečnog perioda
        // Ove informacije omogućavaju AI asistentu da odgovori
        // na pitanja o konkretnim izdacima i dobavljačima.
        List<com.aifinance.backend.entity.Transaction> currentTransactions =
                transactionRepository
                        .findByUser_IdOrderByTransactionDateDescIdDesc(userId)
                        .stream()
                        .filter(transaction ->
                                !transaction.getTransactionDate().isBefore(startDate)
                                        && transaction.getTransactionDate().isBefore(endDate)
                        )
                        .limit(200)
                        .toList();

        StringBuilder transactionSummary = new StringBuilder();

        if (currentTransactions.isEmpty()) {
            transactionSummary.append(
                    "Nema evidentiranih transakcija za ovaj mjesec.\n"
            );
        } else {
            for (com.aifinance.backend.entity.Transaction transaction :
                    currentTransactions) {
                transactionSummary
                        .append("- Datum: ")
                        .append(transaction.getTransactionDate())
                        .append("; Vrsta: ")
                        .append(
                                "INCOME".equals(transaction.getCategory().getType())
                                        ? "prihod"
                                        : "rashod"
                        )
                        .append("; Kategorija: ")
                        .append(transaction.getCategory().getName())
                        .append("; Iznos: ")
                        .append(transaction.getAmount().toPlainString());

                if (transaction.getDescription() != null
                        && !transaction.getDescription().isBlank()) {
                    transactionSummary
                            .append("; Opis: ")
                            .append(transaction.getDescription().trim());
                }

                transactionSummary.append("\n");
            }
        }

        // Budžeti
        List<Budget> budgets = budgetRepository
                .findByUser_IdAndMonthAndYear(
                        userId,
                        month.getMonthValue(),
                        month.getYear()
                );

        StringBuilder budgetSummary = new StringBuilder();

        if (budgets.isEmpty()) {
            budgetSummary.append(
                    "Korisnik nema definisanih budžeta za ovaj mjesec.\n"
            );
        } else {
            for (Budget budget : budgets) {

                BigDecimal limit = budget.getAmountLimit();

                BigDecimal spent = transactionRepository
                        .sumExpensesByCategoryAndPeriod(
                                userId,
                                budget.getCategory().getId(),
                                startDate,
                                endDate
                        );

                if (spent == null) {
                    spent = BigDecimal.ZERO;
                }

                BigDecimal remaining = limit.subtract(spent);

                BigDecimal percentage = BigDecimal.ZERO;

                if (limit.compareTo(BigDecimal.ZERO) > 0) {
                    percentage = spent
                            .multiply(BigDecimal.valueOf(100))
                            .divide(
                                    limit,
                                    2,
                                    RoundingMode.HALF_UP
                            );
                }

                String status;

                if (spent.compareTo(limit) > 0) {
                    status = "PREKORAČEN";
                } else if (spent.compareTo(limit) == 0) {
                    status = "POTPUNO ISKORIŠTEN";
                } else {
                    status = "UNUTAR LIMITA";
                }

                budgetSummary
                        .append("- Kategorija: ")
                        .append(budget.getCategory().getName())
                        .append("\n  Limit: ")
                        .append(limit.toPlainString())
                        .append("\n  Potrošeno: ")
                        .append(spent.toPlainString())
                        .append("\n  Preostalo: ")
                        .append(remaining.toPlainString())
                        .append("\n  Iskorištenost: ")
                        .append(percentage.toPlainString())
                        .append("%")
                        .append("\n  Status: ")
                        .append(status)
                        .append("\n");
            }
        }

        // Ciljevi štednje
        List<SavingGoal> savingGoals = savingGoalRepository
                .findByUser_IdOrderByCreatedAtDescIdDesc(userId);

        StringBuilder savingGoalsSummary = new StringBuilder();

        if (savingGoals.isEmpty()) {
            savingGoalsSummary.append(
                    "Korisnik nema definisanih ciljeva štednje.\n"
            );
        } else {
            for (SavingGoal goal : savingGoals) {

                BigDecimal target = goal.getTargetAmount();
                BigDecimal current = goal.getCurrentAmount();

                BigDecimal remaining = target
                        .subtract(current)
                        .max(BigDecimal.ZERO);

                BigDecimal percentage = BigDecimal.ZERO;

                if (target.compareTo(BigDecimal.ZERO) > 0) {
                    percentage = current
                            .multiply(BigDecimal.valueOf(100))
                            .divide(
                                    target,
                                    2,
                                    RoundingMode.HALF_UP
                            );
                }

                String status = current.compareTo(target) >= 0
                        ? "OSTVAREN"
                        : "U TOKU";

                savingGoalsSummary
                        .append("- Cilj: ")
                        .append(goal.getName())
                        .append("\n  Ciljani iznos: ")
                        .append(target.toPlainString())
                        .append("\n  Trenutno ušteđeno: ")
                        .append(current.toPlainString())
                        .append("\n  Preostalo do cilja: ")
                        .append(remaining.toPlainString())
                        .append("\n  Ostvareno: ")
                        .append(percentage.toPlainString())
                        .append("%")
                        .append("\n  Status: ")
                        .append(status)
                        .append("\n  Planirani datum: ")
                        .append(
                                goal.getTargetDate() != null
                                        ? goal.getTargetDate()
                                        : "Nije definisan"
                        )
                        .append("\n");
            }
        }

        // Finansijski računi
        List<AccountResponse> accounts =
                accountService.getAccountForUser(userId);

        StringBuilder accountSummary = new StringBuilder();

        BigDecimal totalBalance = BigDecimal.ZERO;

        if (accounts.isEmpty()) {
            accountSummary.append(
                    "Korisnik nema evidentiranih finansijskih računa.\n"
            );
        } else {
            for (AccountResponse account : accounts) {

                BigDecimal currentBalance = account.currentBalance();

                totalBalance = totalBalance.add(currentBalance);

                accountSummary
                        .append("- Račun: ")
                        .append(account.name())
                        .append("\n  Tip: ")
                        .append(account.type())
                        .append("\n  Početno stanje: ")
                        .append(account.initialBalance().toPlainString())
                        .append("\n  Trenutno stanje: ")
                        .append(currentBalance.toPlainString())
                        .append("\n");
            }

            accountSummary
                    .append("\nUkupno stanje svih računa: ")
                    .append(totalBalance.toPlainString())
                    .append("\n");
        }

        // Kompletan kontekst
        return """
                Finansijski podaci prijavljenog korisnika:

                Period mjesečnog finansijskog pregleda: %s

                UKUPNI PRIHODI I RASHODI:
                Ukupni prihodi: %s
                Ukupni rashodi: %s
                Neto tok novca: %s

                RASHODI PO KATEGORIJAMA:
                %s

                POJEDINAČNE TRANSAKCIJE ZA ODABRANI MJESEC:
                %s

                BUDŽETI ZA ODABRANI MJESEC:
                %s

                CILJEVI ŠTEDNJE KORISNIKA
                (trenutno evidentirano stanje):
                %s

                FINANSIJSKI RAČUNI KORISNIKA
                (trenutno izračunato stanje):
                %s

                VAŽNE NAPOMENE:
                - Iznose je izračunao Spring Boot backend.
                - Podaci pripadaju prijavljenom korisniku.
                - Neto tok novca nije isto što i stanje računa.
                - Stanja računa obuhvataju sve evidentirane
                  prihode i rashode, ne samo odabrani mjesec.
                - Ciljevi štednje predstavljaju trenutno stanje,
                  a ne historijsko stanje za odabrani mjesec.
                - Ako nema evidentiranih transakcija, nemoj
                  tvrditi da korisnik sigurno nije trošio.
                - Ne izmišljaj valute, iznose ili statuse.
                """.formatted(
                monthLabel,
                income.toPlainString(),
                expenses.toPlainString(),
                netAmount.toPlainString(),
                categorySummary.toString(),
                transactionSummary.toString(),
                budgetSummary.toString(),
                savingGoalsSummary.toString(),
                accountSummary.toString()
        );
    }

    // 2. Selektivni kontekst finansijskih računa
    @Transactional(readOnly = true)
    public String getAccountsContext(Long userId) {

        List<AccountResponse> accounts =
                accountService.getAccountForUser(userId);

        if (accounts.isEmpty()) {
            return "Korisnik nema evidentiranih finansijskih računa.";
        }

        StringBuilder context = new StringBuilder();

        context.append("AKTUELNA STANJA FINANSIJSKIH RAČUNA:\n");

        BigDecimal totalBalance = BigDecimal.ZERO;

        for (AccountResponse account : accounts) {

            BigDecimal balance = account.currentBalance();

            totalBalance = totalBalance.add(balance);

            context
                    .append("- Račun: ")
                    .append(account.name())
                    .append("\n  Trenutno stanje: ")
                    .append(balance.toPlainString())
                    .append("\n");
        }

        context
                .append("Ukupno stanje svih računa: ")
                .append(totalBalance.toPlainString())
                .append("\n");

        context.append(
                "Ovo su trenutno izračunata stanja, " +
                        "a ne historijska stanja računa. " +
                        "Ne navodi valutu ako nije poznata."
        );

        return context.toString();
    }

    // 3. Selektivni kontekst ciljeva štednje
    @Transactional(readOnly = true)
    public String getSavingGoalsContext(Long userId) {

        List<SavingGoal> goals = savingGoalRepository
                .findByUser_IdOrderByCreatedAtDescIdDesc(userId);

        if (goals.isEmpty()) {
            return "Korisnik nema definisanih ciljeva štednje.";
        }

        StringBuilder context = new StringBuilder();

        context.append("AKTUELNI CILJEVI ŠTEDNJE:\n");

        for (SavingGoal goal : goals) {

            BigDecimal target = goal.getTargetAmount();
            BigDecimal current = goal.getCurrentAmount();

            BigDecimal remaining = target
                    .subtract(current)
                    .max(BigDecimal.ZERO);

            BigDecimal percentage = BigDecimal.ZERO;

            if (target.compareTo(BigDecimal.ZERO) > 0) {
                percentage = current
                        .multiply(BigDecimal.valueOf(100))
                        .divide(
                                target,
                                2,
                                RoundingMode.HALF_UP
                        );
            }

            String status = current.compareTo(target) >= 0
                    ? "OSTVAREN"
                    : "U TOKU";

            context
                    .append("- Cilj: ")
                    .append(goal.getName())
                    .append("\n  Ciljani iznos: ")
                    .append(target.toPlainString())
                    .append("\n  Trenutno ušteđeno: ")
                    .append(current.toPlainString())
                    .append("\n  Preostalo: ")
                    .append(remaining.toPlainString())
                    .append("\n  Ostvareno: ")
                    .append(percentage.toPlainString())
                    .append("%")
                    .append("\n  Status: ")
                    .append(status)
                    .append("\n  Planirani datum: ")
                    .append(
                            goal.getTargetDate() != null
                                    ? goal.getTargetDate()
                                    : "Nije definisan"
                    )
                    .append("\n");
        }

        context.append(
                "Ovo su trenutno evidentirani podaci o štednji.\n" +
                        "Ne izmišljaj valutu ili finansijske iznose."
        );

        return context.toString();
    }
}
