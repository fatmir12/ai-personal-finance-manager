package com.aifinance.backend.repository;

import com.aifinance.backend.entity.SavingGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SavingGoalRepository extends JpaRepository<SavingGoal,Long> {
    List<SavingGoal> findByUser_IdOrderByCreatedAtDescIdDesc(Long userId);
}
