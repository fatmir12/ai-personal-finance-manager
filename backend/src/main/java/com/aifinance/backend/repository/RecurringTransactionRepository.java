package com.aifinance.backend.repository;

import com.aifinance.backend.entity.RecurringTransaction;
import com.aifinance.backend.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RecurringTransactionRepository extends JpaRepository<RecurringTransaction,Long> {
    List<RecurringTransaction> findByUser_IdOrderByCreatedAtDescIdDesc(
            Long userId
    );

    List<RecurringTransaction> findByActiveTrueAndNextRunDateLessThanEqual(LocalDate date);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
SELECT r FROM RecurringTransaction r WHERE r.id=:id
""")
    Optional<RecurringTransaction> findByIdForUpdate(@Param("id") Long id);
}
