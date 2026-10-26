package com.aifinance.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

    @Entity
    @Table(name="categories",schema = "dbo")
    @Getter
    @Setter
    public class Category{
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private long id;

        @Column(name="name",nullable = false,length = 100)
        private String name;

        @Column(name = "type", nullable = false,length = 20)
        private String type;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id")
        private User user;
    }

