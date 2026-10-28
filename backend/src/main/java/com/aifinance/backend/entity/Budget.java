package com.aifinance.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "budgets", schema = "dbo")
@Getter
@Setter
public class Budget {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id",nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="category_id",nullable = false)
    private Category category;

    @Column(
            name = "amount_limit",
            nullable = false,
            precision = 10,
            scale = 2
    )
    private BigDecimal amountLimit;

    @Column(name = "month",nullable = false)
    private Integer month;
    @Column(name = "year",nullable = false)
    private Integer year;
    @Column(name = "created_at",nullable = false)
    private LocalDateTime createdAt;
}
