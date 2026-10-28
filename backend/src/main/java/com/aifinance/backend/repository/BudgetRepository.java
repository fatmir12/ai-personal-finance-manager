package com.aifinance.backend.repository;

import com.aifinance.backend.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BudgetRepository extends JpaRepository<Budget,Long> {
    List<Budget> findByUser_IdOrderByYearDescMonthDesc(Long userId);

    boolean existsByUser_IdAndCategory_IdAndMonthAndYear(
            Long userId,
            Long categoryId,
            Integer month,
            Integer year
    );

    boolean existsByUser_IdAndCategory_IdAndMonthAndYearAndIdNot(
            Long userId,
            Long categoryId,
            Integer month,
            Integer year,
            Long budgetId
    );
}
