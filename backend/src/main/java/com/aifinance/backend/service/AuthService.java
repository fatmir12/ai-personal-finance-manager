package com.aifinance.backend.service;

import com.aifinance.backend.dto.RegisterRequest;
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

    public AuthService(UserRepository userRepository,PasswordEncoder passwordEncoder,JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
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

    public String login(LoginRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        User user=userRepository.findByEmail(email)
                .orElseThrow(()->new InvalidCredentialsException("Neispravan email ili lozinka"));

        if(!passwordEncoder.matches(request.password(),user.getPasswordHash())){
            throw new InvalidCredentialsException("Neispravan email ili lozinka");
        }
        return jwtService.generateToken(user.getId());
    }
}
