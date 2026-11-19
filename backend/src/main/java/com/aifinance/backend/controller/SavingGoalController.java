package com.aifinance.backend.controller;

import com.aifinance.backend.dto.SavingGoalRequest;
import com.aifinance.backend.dto.SavingGoalResponse;
import com.aifinance.backend.service.SavingGoalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/saving-goals")
public class SavingGoalController {
    private final SavingGoalService savingGoalService;
    public SavingGoalController(SavingGoalService savingGoalService) {
        this.savingGoalService = savingGoalService;
    }
    @PostMapping
    public ResponseEntity<SavingGoalResponse> createSavingGoal(
            @Valid @RequestBody SavingGoalRequest request,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());

        SavingGoalResponse response=savingGoalService.createSavingGoal(request,userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    @GetMapping
    public ResponseEntity<List<SavingGoalResponse>> getSavingGoals(
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());
        List<SavingGoalResponse> goals=savingGoalService.getSavingGoalsForUser(userId);
        return ResponseEntity.ok(goals);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavingGoalResponse> updateSavingGoal(
            @PathVariable Long id,
            @Valid @RequestBody SavingGoalRequest request,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());

        SavingGoalResponse response=savingGoalService.updateSavingGoal(id,request,userId);
        return ResponseEntity.ok(response);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSavingGoal(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());
        savingGoalService.deleteSavingGoal(id,userId);
        return ResponseEntity.noContent().build();
    }
}
