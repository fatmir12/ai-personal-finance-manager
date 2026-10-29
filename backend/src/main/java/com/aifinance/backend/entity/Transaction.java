package com.aifinance.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name="transactions",schema="dbo")
@Getter
@Setter
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="user_id",nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="category_id",nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id",nullable = false)
    private Account account;

    @Column(name = "amount",nullable = false,precision = 10,scale = 2)
    private BigDecimal amount;

    @Column(name = "description",length = 500)
    private String description;

    @Column(name="transaction_date",nullable = false)
    private LocalDate transactionDate;

    @Column(name="created_at",nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "recurring_rule_id")
    private Long recurringRuleId;

    @Column(name = "recurring_due_date")
    private LocalDate recurringDueDate;
}
