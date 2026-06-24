package com.accessmanager.dto.response;

public record AuthResponse(
        String token,
        String email,
        String role
) {}
