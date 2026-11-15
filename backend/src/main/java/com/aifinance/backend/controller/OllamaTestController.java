package com.aifinance.backend.controller;

import com.aifinance.backend.service.OllamaService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/test")
public class OllamaTestController {
    private final OllamaService ollamaService;
    public OllamaTestController(OllamaService ollamaService) {
        this.ollamaService = ollamaService;
    }
    @PostMapping
    public ResponseEntity<TestResponse> testOllama(
            @Valid @RequestBody TestRequest request,
            @AuthenticationPrincipal Jwt jwt
            ){
        String answer = ollamaService.ask(request.question());
        return ResponseEntity.ok(new TestResponse(answer));
    }
    public record TestRequest(
            @NotBlank
            @Size(max = 2000)
            String question
    ){}
    public record TestResponse(String answer){}
}
