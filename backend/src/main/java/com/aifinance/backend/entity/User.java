package com.aifinance.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;



    @Entity
    @Table(name="users")
    @Getter
    @Setter
    public class User{
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private long id;

        @Column(name ="first_name",nullable = false,length = 100)
        private String firstName;

        @Column (name="last_name",nullable = false,length = 100)
        private String lastName;

        @Column(nullable = false,unique = true,length = 255)
        private String email;

        @Column(name="password_hash",nullable = false,length = 255)
        private String passwordHash;

        @Column(name="created_at",nullable = false)
        private LocalDateTime createdAt;

        public User(){

        }
    }
