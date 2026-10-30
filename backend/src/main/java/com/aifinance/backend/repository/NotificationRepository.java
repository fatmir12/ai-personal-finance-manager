package com.aifinance.backend.repository;

import com.aifinance.backend.entity.Notification;
import com.aifinance.backend.entity.User;
import org.aspectj.weaver.ast.Not;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification,Long> {
    List<Notification> findByUser_IdOrderByCreatedAtDescIdDesc(Long userId);
    long countByUser_IdAndReadFalse(Long userId);

    Long user(User user);
}
