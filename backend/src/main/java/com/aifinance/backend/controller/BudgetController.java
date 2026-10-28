package com.aifinance.backend.controller;

import com.aifinance.backend.dto.BudgetRequest;
import com.aifinance.backend.dto.BudgetResponse;
import com.aifinance.backend.entity.Budget;
import com.aifinance.backend.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {
    private final BudgetService budgetService;
    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @PostMapping
    public ResponseEntity<BudgetResponse> createBudget(
            @Valid @RequestBody BudgetRequest request,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());
        BudgetResponse response=budgetService.createBudget(request,userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    @GetMapping
    public List<BudgetResponse> getBudgets(@AuthenticationPrincipal Jwt jwt){
        Long userId=Long.valueOf(jwt.getSubject());
        return budgetService.getBudgetsForUser(userId);
    }
    @PutMapping("/{id}")
    public ResponseEntity<BudgetResponse> updateBudget(
            @PathVariable Long id,
            @Valid @RequestBody BudgetRequest request,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());
        BudgetResponse response=budgetService.updateBudget(id,request,userId);
        return ResponseEntity.ok(response);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudget(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());
        budgetService.deleteBudget(id,userId);
        return ResponseEntity.noContent().build();
    }
}
