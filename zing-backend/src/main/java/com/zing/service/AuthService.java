package com.zing.service;

import com.zing.dto.AuthResponse;
import com.zing.dto.LoginRequest;
import com.zing.dto.SignupRequest;

public interface AuthService {

    AuthResponse signup(SignupRequest request);

    AuthResponse login(LoginRequest request);
}