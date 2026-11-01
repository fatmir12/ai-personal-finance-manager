package com.aifinance.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_messages",schema = "dbo")
@Getter
@Setter
public class AiMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id",nullable = false)
    private AiConversation conversation;

    @Column(name = "role", nullable = false,length = 20)
    private String role;

    @Column(name = "content",nullable = false,columnDefinition = "NVARCHAR(MAX)")
    private String content;

    @Column(name = "created_at",nullable = false)
    private LocalDateTime createdAt;
}
