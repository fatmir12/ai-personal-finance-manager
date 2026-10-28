package com.aifinance.backend.service;

import com.aifinance.backend.dto.BudgetRequest;
import com.aifinance.backend.dto.BudgetResponse;
import com.aifinance.backend.entity.Budget;
import com.aifinance.backend.entity.Category;
import com.aifinance.backend.entity.User;
import com.aifinance.backend.repository.BudgetRepository;
import com.aifinance.backend.repository.CategoryRepository;
import com.aifinance.backend.repository.TransactionRepository;
import com.aifinance.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class BudgetService {
    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    public BudgetService(BudgetRepository budgetRepository, CategoryRepository categoryRepository, UserRepository userRepository, TransactionRepository transactionRepository) {
        this.budgetRepository = budgetRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
    }
    @Transactional
    public BudgetResponse createBudget(BudgetRequest request,Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND, "Korisnik nije pronađen"));
        Category category =categoryRepository.findById(request.categoryId())
                .orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND,"Kategorija nije pronađena"));
        if(category.getUser()!=null && category.getUser().getId() != userId){
            throw  new ResponseStatusException(HttpStatus.NOT_FOUND,"Kategorija nije pronađena");
        }
        if(!"EXPENSE".equals(category.getType())){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Budžet se može kreirati samo za kategorije rashoda");
        }
        boolean exists=budgetRepository.existsByUser_IdAndCategory_IdAndMonthAndYear(
                userId,
                request.categoryId(),
                request.month(),
                request.year()
        );
        if(exists){
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Budžet za ovu kategoriju i mjesec već postoji");
        }
        Budget budget = new Budget();

        budget.setUser(user);
        budget.setCategory(category);
        budget.setAmountLimit(request.amountLimit());
        budget.setMonth(request.month());
        budget.setYear(request.year());
        budget.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        System.out.println("MONTH = " + budget.getMonth());
        System.out.println("YEAR = " + budget.getYear());

        Budget saved=budgetRepository.save(budget);

        BigDecimal spentAmount=calculateSpentAmount(
                userId,
                saved.getCategory().getId(),
                saved.getMonth(),
                saved.getYear()
        );
        BigDecimal remainingAmount=saved.getAmountLimit()
                .subtract(spentAmount);

        return new BudgetResponse(
                saved.getId(),
                category.getId(),
                category.getName(),
                saved.getAmountLimit(),
                spentAmount,
                remainingAmount,
                saved.getMonth(),
                saved.getYear(),
                saved.getCreatedAt()
        );
    }
    @Transactional(readOnly = true)
    public List<BudgetResponse> getBudgetsForUser(Long userId) {
        return budgetRepository
                .findByUser_IdOrderByYearDescMonthDesc(userId)
                .stream()
                .map(budget -> {
                    BigDecimal spentAmount=calculateSpentAmount(
                            userId,
                            budget.getCategory().getId(),
                            budget.getMonth(),
                            budget.getYear()
                    );
                    BigDecimal remainingAmount=budget.getAmountLimit()
                            .subtract(spentAmount);
                    return new BudgetResponse(
                            budget.getId(),
                            budget.getCategory().getId(),
                            budget.getCategory().getName(),
                            budget.getAmountLimit(),
                            spentAmount,
                            remainingAmount,
                            budget.getMonth(),
                            budget.getYear(),
                            budget.getCreatedAt()
                    );
                }).toList();
    }
    @Transactional
    public BudgetResponse updateBudget(
            Long budgetId,
            BudgetRequest request,
            Long userId
    ){
        Budget budget = budgetRepository
                .findById(budgetId)
                .orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND,"Budžet nije pronađen"));
        if(budget.getUser().getId()!=userId){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Budžet nije pronađen");
        }
        Category category=categoryRepository
                .findById(request.categoryId())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Kategorija nije pronađena"));
        if(category.getUser()!=null && category.getUser().getId()!=userId){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Kategorija nije pronađena");
        }

        if(!"EXPENSE".equals(category.getType())){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Budžet se može kreirati samo za kategorije rashoda");
        }

        boolean exists=budgetRepository.existsByUser_IdAndCategory_IdAndMonthAndYearAndIdNot(
                userId,
                request.categoryId(),
                request.month(),
                request.year(),
                budgetId
        );
        if(exists){
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,"Budžet za pvu kategoriju i mjesec već postoji"
            );
        }
        budget.setCategory(category);
        budget.setAmountLimit(request.amountLimit());
        budget.setMonth(request.month());
        budget.setYear(request.year());

        Budget saved=budgetRepository.save(budget);

        BigDecimal spentAmount=calculateSpentAmount(
                userId,
                saved.getCategory().getId(),
                saved.getMonth(),
                saved.getYear()
        );

        BigDecimal remainingAmount=saved.getAmountLimit().subtract(spentAmount);

        return new BudgetResponse(
                saved.getId(),
                saved.getCategory().getId(),
                saved.getCategory().getName(),
                saved.getAmountLimit(),
                spentAmount,
                remainingAmount,
                saved.getMonth(),
                saved.getYear(),
                saved.getCreatedAt()
        );
    }

    @Transactional
    public void deleteBudget(Long budgetId,Long userId){
        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Budžet nije pronađen"));
        if(budget.getUser().getId()!=userId){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Budžet nije pronađen");
        }
        budgetRepository.delete(budget);
    }

    private BigDecimal calculateSpentAmount(
            Long userId,
            Long categoryId,
            Integer month,
            Integer year
    ){
        LocalDate startDate=LocalDate.of(year,month,1);
        LocalDate endDate=startDate.plusMonths(1);

        BigDecimal spent=transactionRepository
                .sumExpensesByCategoryAndPeriod(
                        userId,
                        categoryId,
                        startDate,
                        endDate
                );
        return spent != null ? spent : BigDecimal.ZERO;
    }
}
