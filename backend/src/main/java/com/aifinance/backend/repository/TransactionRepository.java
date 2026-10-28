package com.aifinance.backend.repository;

import com.aifinance.backend.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction,Long> {
    List<Transaction> findByUser_IdOrderByTransactionDateDescIdDesc(Long userId);

    boolean existsByCategory_Id(Long categoryId);
    @Query("""
SELECT SUM(t.amount)
FROM Transaction t
WHERE t.account.id = :accountId
AND t.user.id=:userId
AND t.category.type='INCOME'
""")
    BigDecimal sumIncomeByAccount(
            @Param("accountId") Long accountId,
            @Param("userId") Long userId
    );

    @Query("""
SELECT SUM(t.amount)
FROM Transaction t 
WHERE t.account.id=:accountId
AND t.user.id =:userId
AND t.category.type='EXPENSE'
""")
    BigDecimal sumExpenseByAccount(
            @Param("accountId") Long accountId,
            @Param("userId") Long userId
    );

    boolean existsByAccount_Id(Long accountId);


    @Query("""
    SELECT SUM(t.amount)
    FROM Transaction t
    WHERE t.user.id = :userId
      AND t.category.id = :categoryId
      AND t.category.type = 'EXPENSE'
      AND t.transactionDate >= :startDate
      AND t.transactionDate < :endDate
    """)
    BigDecimal sumExpensesByCategoryAndPeriod(
            @Param("userId") Long userId,
            @Param("categoryId") Long categoryId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

}
