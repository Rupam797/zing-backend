package com.zing.service.impl;

import com.zing.dto.AuthResponse;
import com.zing.dto.LoginRequest;
import com.zing.dto.SignupRequest;
import com.zing.exception.BadRequestException;
import com.zing.model.Role;
import com.zing.model.User;
import com.zing.repository.UserRepository;
import com.zing.service.AuthService;
import com.zing.util.JwtUtil;
import com.zing.util.PasswordUtil;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public AuthServiceImpl(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public AuthResponse signup(SignupRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        // Resolve role (default USER, block ADMIN self-signup)
        Role role = Role.USER;
        if (request.getRole() != null && !request.getRole().isBlank()) {
            try {
                role = Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid role: " + request.getRole());
            }
            if (role == Role.ADMIN) {
                throw new BadRequestException("Admin accounts cannot be self-registered");
            }
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(PasswordUtil.hashPassword(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole(role);

        userRepository.save(user);

        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole().name()
        );

        return new AuthResponse(token, "Signup successful");
    }

    @Override
    public AuthResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));

        if (!PasswordUtil.matches(
                request.getPassword(),
                user.getPassword()
        )) {
            throw new BadRequestException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole().name()
        );

        return new AuthResponse(token, "Login successful");
    }
}