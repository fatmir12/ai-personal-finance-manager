package com.aifinance.backend.service;

import com.aifinance.backend.entity.RefreshToken;
import com.aifinance.backend.entity.User;
import com.aifinance.backend.repository.RefreshTokenRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class RefreshTokenService {
    private final RefreshTokenRepository refreshTokenRepository;
    private final SecureRandom secureRandom=new SecureRandom();
    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }
    public String createRefreshToken(User user){
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String token= Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        RefreshToken refreshToken = new RefreshToken();

        refreshToken.setUser(user);
        refreshToken.setTokenHash(hashToken(token));
        refreshToken.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
        refreshToken.setExpiresAt(LocalDateTime.now(ZoneOffset.UTC).plusDays(7));

        refreshTokenRepository.save(refreshToken);
        return token;
    }

    @Transactional
    public User rotateRefreshToken(String token){
        String tokenHash = hashToken(token);

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHash).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Nevažeći Refresh token"));
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        if(refreshToken.getRevokedAt() != null || !refreshToken.getExpiresAt().isAfter(now)){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Refresh token je istekao ili je opozvan");
        }

        refreshToken.setRevokedAt(now);
        refreshTokenRepository.save(refreshToken);
        return refreshToken.getUser();
    }

    @Transactional
    public void revokeRefreshToken(String token){
        String tokenHash = hashToken(token);

        RefreshToken refreshToken=refreshTokenRepository.findByTokenHash(tokenHash).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Nevažeći Refresh token"));
        if (refreshToken.getRevokedAt() != null){
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Refresh token je već opozvan");
        }
        refreshToken.setRevokedAt(LocalDateTime.now(ZoneOffset.UTC));
        refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public void revokeAllRefreshTokens(User user) {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        refreshTokenRepository
                .findByUserAndRevokedAtIsNull(user)
                .forEach(refreshToken -> {
                    refreshToken.setRevokedAt(now);
                    refreshTokenRepository.save(refreshToken);
                });
    }

    private String hashToken(String token){
        try {
            MessageDigest digest=MessageDigest.getInstance("SHA-256");
            byte[] hash=digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        }catch(NoSuchAlgorithmException e){
            throw new IllegalStateException("SHA-256 algoritam nije dostupan");
        }
    }
}
