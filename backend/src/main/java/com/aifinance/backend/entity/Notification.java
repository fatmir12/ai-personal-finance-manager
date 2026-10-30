package com.aifinance.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;


@Entity
@Table(name = "notifications", schema = "dbo")
@Setter
@Getter
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id",nullable = false)
    private User user;

    @Column(name = "title",nullable = false,length = 150)
    private String title;

    @Column(name = "message",nullable = false,length = 500)
    private String message;

    @Column(name = "type",nullable = false,length = 30)
    private String type;

    @Column(name = "is_read",nullable = false)
    private boolean read=false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
