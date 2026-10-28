package com.aifinance.backend.repository;

import com.aifinance.backend.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
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
}
