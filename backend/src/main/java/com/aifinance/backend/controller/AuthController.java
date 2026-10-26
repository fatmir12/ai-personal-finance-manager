package com.aifinance.backend.controller;

import com.aifinance.backend.dto.LoginRequest;
import com.aifinance.backend.dto.LoginResponse;
import com.aifinance.backend.dto.RefreshTokenRequest;
import com.aifinance.backend.dto.RegisterRequest;
import com.aifinance.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String,String>> register(
            @Valid @RequestBody RegisterRequest request){
        authService.register(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message","Korisnik uspješno registrovan"));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request){

        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(
            @Valid @RequestBody RefreshTokenRequest request
            ){
        System.out.println("REFRESH ENDPOINT JE POZVAN");

        return ResponseEntity.ok(authService.refresh(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @Valid @RequestBody RefreshTokenRequest request
    ){
        authService.logout(request);
        return ResponseEntity.noContent().build();
    }
}
