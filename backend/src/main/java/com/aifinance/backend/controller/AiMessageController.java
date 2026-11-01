package com.aifinance.backend.controller;

import com.aifinance.backend.dto.AiMessageRequest;
import com.aifinance.backend.dto.AiMessageResponse;
import com.aifinance.backend.service.AiMessageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/conversations/{conversationId}/messages")
public class AiMessageController {
    private final AiMessageService messageService;
    public AiMessageController(AiMessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping
    public ResponseEntity<AiMessageResponse> sendMessage(
            @PathVariable Long conversationId,
            @Valid @RequestBody AiMessageRequest request,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());

        AiMessageResponse response=messageService.sendMessage(
                conversationId,request,userId
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    @GetMapping
    public List<AiMessageResponse> getConversationMessage(
            @PathVariable Long conversationId,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());
        return messageService.getConversationMessages(conversationId,userId);
    }
}
