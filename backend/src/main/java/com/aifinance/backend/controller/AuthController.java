
package com.aifinance.backend.controller;

import com.aifinance.backend.dto.AccessTokenResponse;
import com.aifinance.backend.dto.LoginRequest;
import com.aifinance.backend.dto.LoginResponse;
import com.aifinance.backend.dto.RefreshTokenRequest;
import com.aifinance.backend.dto.RegisterRequest;
import com.aifinance.backend.dto.ProfileResponse;
import com.aifinance.backend.dto.ChangePasswordRequest;

import com.aifinance.backend.service.AuthService;
import com.aifinance.backend.service.RefreshTokenCookieService;

import jakarta.validation.Valid;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenCookieService cookieService;

    public AuthController(
            AuthService authService,
            RefreshTokenCookieService cookieService
    ) {
        this.authService = authService;
        this.cookieService = cookieService;
    }

    @GetMapping("/csrf")
    public ResponseEntity<Void> csrf(CsrfToken csrfToken) {
        csrfToken.getToken();

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        authService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of(
                        "message",
                        "Korisnik uspješno registrovan"
                ));
    }

    @PostMapping("/login")
    public ResponseEntity<AccessTokenResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        LoginResponse response = authService.login(request);

        AccessTokenResponse body = new AccessTokenResponse(
                response.accessToken(),
                response.tokenType()
        );

        return ResponseEntity
                .ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        cookieService
                                .createCookie(response.refreshToken())
                                .toString()
                )
                .body(body);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AccessTokenResponse> refresh(
            @CookieValue(
                    name = RefreshTokenCookieService.COOKIE_NAME,
                    required = false
            )
            String refreshToken
    ) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Refresh token nije dostupan"
            );
        }

        LoginResponse response = authService.refresh(
                new RefreshTokenRequest(refreshToken)
        );

        AccessTokenResponse body = new AccessTokenResponse(
                response.accessToken(),
                response.tokenType()
        );

        return ResponseEntity
                .ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        cookieService
                                .createCookie(response.refreshToken())
                                .toString()
                )
                .body(body);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(
                    name = RefreshTokenCookieService.COOKIE_NAME,
                    required = false
            )
            String refreshToken
    ) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            try {
                authService.logout(
                        new RefreshTokenRequest(refreshToken)
                );
            } catch (ResponseStatusException exception) {
                if (exception.getStatusCode().value() != 401) {
                    throw exception;
                }
            }
        }

        return ResponseEntity
                .noContent()
                .header(
                        HttpHeaders.SET_COOKIE,
                        cookieService.deleteCookie().toString()
                )
                .build();
    }

    @GetMapping("/me")
    public ProfileResponse getProfile(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = Long.valueOf(jwt.getSubject());
        return authService.getProfile(userId);
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = Long.valueOf(jwt.getSubject());
        authService.changePassword(userId, request);

        return ResponseEntity.ok(
                Map.of("message", "Lozinka je uspješno promijenjena")
        );
    }
}
