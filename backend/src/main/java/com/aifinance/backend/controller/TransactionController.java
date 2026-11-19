package com.aifinance.backend.controller;

import com.aifinance.backend.dto.TransactionRequest;
import com.aifinance.backend.dto.TransactionResponse;
import com.aifinance.backend.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> createTransacation(
            @Valid @RequestBody TransactionRequest request,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());

        TransactionResponse response=transactionService.createTransaction(request,userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public List<TransactionResponse> getTransactions(@AuthenticationPrincipal Jwt jwt){
        Long userId=Long.valueOf(jwt.getSubject());
        return transactionService.getTransactionsForUser(userId);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponse> updateTransaction(
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());

        TransactionResponse response=transactionService.updateTransaction(id,request,userId);
        return ResponseEntity.ok(response);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());
        transactionService.deleteTransaction(id,userId);
        return ResponseEntity.noContent().build();
    }

}
