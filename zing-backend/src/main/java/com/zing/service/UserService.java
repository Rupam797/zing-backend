package com.zing.service;

import com.zing.model.User;

public interface UserService {

    User getUserById(Long userId);

    User getUserByEmail(String email);
}