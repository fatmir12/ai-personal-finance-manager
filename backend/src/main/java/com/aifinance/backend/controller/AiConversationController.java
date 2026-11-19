package com.aifinance.backend.controller;

import com.aifinance.backend.dto.AiConversationRequest;
import com.aifinance.backend.dto.AiConversationResponse;
import com.aifinance.backend.service.AiConversationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/conversations")
public class AiConversationController {
    private final AiConversationService conversationService;
    public AiConversationController(AiConversationService conversationService) {
        this.conversationService = conversationService;
    }
    @PostMapping
    public ResponseEntity<AiConversationResponse> createConversation(
            @Valid @RequestBody AiConversationRequest request,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());
        AiConversationResponse response=conversationService.createConversation(request,userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    @GetMapping
    public List<AiConversationResponse> getMyConversation(
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());
        return conversationService.getConversationForUser(userId);
    }
    @GetMapping("/{id}")
    public AiConversationResponse getConversationById(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());
        return conversationService.getConversationById(id,userId);
    }
    @PatchMapping("/{id}")
    public AiConversationResponse updateConversation(
            @PathVariable Long id,
            @Valid @RequestBody AiConversationRequest request,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());
        return conversationService.updateConversation(id,request,userId);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConversation(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());
        conversationService.deleteConversation(id,userId);
        return ResponseEntity.noContent().build();
    }
}
