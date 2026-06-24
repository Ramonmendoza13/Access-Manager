package com.accessmanager.service;

import com.accessmanager.dto.request.LoginRequest;
import com.accessmanager.dto.response.AuthResponse;
import com.accessmanager.model.User;
import com.accessmanager.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public AuthResponse login(LoginRequest request) {
        log.info("Attempting login for user: {}", request.email());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );

            User user = (User) authentication.getPrincipal();
            String token = jwtUtil.generateToken(user);

            log.info("User {} successfully authenticated", request.email());

            return new AuthResponse(token, user.getEmail(), user.getRole());
        } catch (Exception e) {
            log.error("Authentication failed for user: {}", request.email(), e);
            throw e;
        }
    }
}
