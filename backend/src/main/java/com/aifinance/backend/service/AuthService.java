package com.aifinance.backend.service;

import com.aifinance.backend.dto.LoginResponse;
import com.aifinance.backend.dto.RefreshTokenRequest;
import com.aifinance.backend.dto.RegisterRequest;
import com.aifinance.backend.dto.ProfileResponse;
import com.aifinance.backend.dto.ChangePasswordRequest;
import com.aifinance.backend.entity.User;
import com.aifinance.backend.repository.UserRepository;
import com.aifinance.backend.dto.LoginRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.aifinance.backend.exception.InvalidCredentialsException;


import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthService(UserRepository userRepository,PasswordEncoder passwordEncoder,JwtService jwtService,RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    @Transactional
    public void register(RegisterRequest request) {
        String email= request.email().trim().toLowerCase(Locale.ROOT);

        if(userRepository.existsByEmail(email)){
            throw new IllegalArgumentException("Korisnik sa ovom email adresom već postoji");
        }

        User user= new User();
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(email);

        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setCreatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public LoginResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();

        User user=userRepository.findByEmail(email)
                .orElseThrow(()->new InvalidCredentialsException("Neispravan email ili lozinka"));

        if(!passwordEncoder.matches(request.password(),user.getPasswordHash())){
            throw new InvalidCredentialsException("Neispravan email ili lozinka");
        }
        String accesToken=jwtService.generateToken(user.getId());
        String refreshToken=refreshTokenService.createRefreshToken(user);
        return new LoginResponse(
                accesToken,
                refreshToken,
                "Bearer"
        );
    }

    @Transactional
    public LoginResponse refresh(RefreshTokenRequest request){
        User user=refreshTokenService.rotateRefreshToken(
                request.refreshToken()
        );

        String accesToken=jwtService.generateToken(user.getId());

        String refreshToken=refreshTokenService.createRefreshToken(user);

        return new LoginResponse(
                accesToken,
                refreshToken,
                "Bearer"
        );
    }

    public ProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Korisnički profil nije pronađen")
                );

        return new ProfileResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getCreatedAt()
        );
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Korisnički profil nije pronađen")
                );

        if (!passwordEncoder.matches(
                request.currentPassword(),
                user.getPasswordHash()
        )) {
            throw new InvalidCredentialsException(
                    "Trenutna lozinka nije ispravna"
            );
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException(
                    "Nova lozinka mora biti različita od trenutne lozinke"
            );
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        refreshTokenService.revokeAllRefreshTokens(user);
    }

    @Transactional
    public void logout(RefreshTokenRequest request){
        refreshTokenService.revokeRefreshToken(
                request.refreshToken()
        );
    }
}
