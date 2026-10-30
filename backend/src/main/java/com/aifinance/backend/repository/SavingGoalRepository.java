package com.aifinance.backend.repository;

import com.aifinance.backend.entity.SavingGoal;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SavingGoalRepository extends JpaRepository<SavingGoal,Long> {
    List<SavingGoal> findByUser_IdOrderByCreatedAtDescIdDesc(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SavingGoal s WHERE s.id = :id")
    Optional<SavingGoal> findByIdForUpdate(@Param("id") Long id);

}
