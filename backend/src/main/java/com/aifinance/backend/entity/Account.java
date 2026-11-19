package com.aifinance.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name="accounts", schema = "dbo")
@Getter @Setter
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="user_id",nullable = false)
    private User user;

    @Column(name = "name",nullable = false,length = 100)
    private String name;

    @Column(name = "type",nullable = false,length = 20)
    private String type;

    @Column(
            name = "initial_balance",
            nullable = false,
            precision = 10,
            scale = 2
    )
    private BigDecimal initialBalance;

    @Column(name = "created_at",nullable = false)
    private LocalDateTime createdAt;
}
