package com.aifinance.backend.repository;

import com.aifinance.backend.entity.Budget;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

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

    Optional<Budget> findByUser_IdAndCategory_IdAndMonthAndYear(
            Long userId,
            Long categoryId,
            Integer month,
            Integer year
    );



    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
       SELECT b
       FROM Budget b
       WHERE b.user.id = :userId
         AND b.category.id = :categoryId
         AND b.month = :month
         AND b.year = :year
       """)
    Optional<Budget> findByPeriodForUpdate(
            @Param("userId") Long userId,
            @Param("categoryId") Long categoryId,
            @Param("month") Integer month,
            @Param("year") Integer year
    );


    List<Budget> findByUser_IdAndMonthAndYear(
            Long userId,
            Integer month,
            Integer year
    );


}
