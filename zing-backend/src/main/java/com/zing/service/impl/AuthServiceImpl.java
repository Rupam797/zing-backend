package com.zing.service.impl;

import com.zing.dto.AuthResponse;
import com.zing.dto.LoginRequest;
import com.zing.dto.SignupRequest;
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

    public AuthServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public AuthResponse signup(SignupRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(PasswordUtil.hashPassword(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole(Role.USER);

        userRepository.save(user);

        String token = JwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, "Signup successful");
    }

    @Override
    public AuthResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!PasswordUtil.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = JwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, "Login successful");
    }
}