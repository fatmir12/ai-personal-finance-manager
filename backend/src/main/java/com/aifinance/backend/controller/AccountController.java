package com.aifinance.backend.controller;

import com.aifinance.backend.dto.AccountRequest;
import com.aifinance.backend.dto.AccountResponse;
import com.aifinance.backend.entity.Account;
import com.aifinance.backend.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {
    private final AccountService accountService;
    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    public ResponseEntity<AccountResponse> createAccount(
            @Valid @RequestBody AccountRequest request,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());
        AccountResponse response=accountService.createAccount(request,userId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public List<AccountResponse> getAccounts(@AuthenticationPrincipal Jwt jwt){
        Long userId=Long.valueOf(jwt.getSubject());
        return accountService.getAccountForUser(userId);
    }
    @PutMapping("/{id}")
    public ResponseEntity<AccountResponse> updateAccount(
            @PathVariable Long id,
            @Valid @RequestBody AccountRequest request,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());
        AccountResponse response=accountService.updateAccount(id,request,userId);
        return ResponseEntity.ok(response);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());
        accountService.deleteAccount(id,userId);
        return ResponseEntity.noContent().build();
    }
}
