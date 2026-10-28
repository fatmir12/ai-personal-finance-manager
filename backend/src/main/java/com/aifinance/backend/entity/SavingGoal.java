package com.aifinance.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "saving_goals", schema = "dbo")
@Getter
@Setter
public class SavingGoal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id",nullable = false)
    private User user;

    @Column(
            name = "target_amount",
            nullable = false,
            precision = 10,
            scale = 2
    )
    private BigDecimal targetAmount;

    @Column(
            name = "current_amount",
            nullable = false,
            precision = 10,
            scale = 2
    )
    private BigDecimal currentAmount;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(name = "created_at",nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "name", nullable = false, length = 100)
    private String name;
}
