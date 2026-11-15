
package com.aifinance.backend.controller;

import com.aifinance.backend.dto.AiChatResponse;
import com.aifinance.backend.dto.AiMessageRequest;
import com.aifinance.backend.dto.AiMessageResponse;
import com.aifinance.backend.service.AiChatService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/conversations/{conversationId}/chat")
public class AiChatController {

    private final AiChatService chatService;

    public AiChatController(AiChatService chatService) {
        this.chatService = chatService;
    }

    // Postojeći AI chat endpoint
    @PostMapping
    public ResponseEntity<AiMessageResponse> sendMessage(
            @PathVariable Long conversationId,
            @Valid @RequestBody AiMessageRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = Long.valueOf(jwt.getSubject());

        AiMessageResponse response = chatService.sendMessage(
                conversationId,
                request.content(),
                userId
        );

        return ResponseEntity.ok(response);
    }

    // Novi endpoint: AI odgovor + strukturirani podaci
    @PostMapping("/saving-goals/{goalId}")
    public ResponseEntity<AiChatResponse> sendSavingGoalMessage(
            @PathVariable Long conversationId,
            @PathVariable Long goalId,
            @Valid @RequestBody AiMessageRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = Long.valueOf(jwt.getSubject());

        AiChatResponse response =
                chatService.sendSavingGoalMessage(
                        conversationId,
                        goalId,
                        request.content(),
                        userId
                );

        return ResponseEntity.ok(response);
    }
}
