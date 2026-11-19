package com.aifinance.backend.repository;

import com.aifinance.backend.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountRepository extends JpaRepository<Account,Long> {
    List<Account> findByUser_IdOrderByIdAsc(Long userId);
}
