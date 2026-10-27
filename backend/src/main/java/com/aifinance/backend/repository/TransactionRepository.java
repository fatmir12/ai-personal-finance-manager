package com.aifinance.backend.repository;

import com.aifinance.backend.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction,Long> {
    List<Transaction> findByUser_IdOrderByTransactionDateDescIdDesc(Long userId);

    boolean existsByCategory_Id(Long categoryId);
}
