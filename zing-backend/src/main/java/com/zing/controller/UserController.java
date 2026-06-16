package com.zing.controller;

import com.zing.model.User;
import com.zing.repository.UserRepository;
import com.zing.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    public UserController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(Principal principal) {
        return ResponseEntity.ok(
                userService.getUserByEmail(principal.getName())
        );
    }

    // 📍 Save / update delivery address
    @PutMapping("/me/address")
    public ResponseEntity<User> updateAddress(
            @RequestBody Map<String, Object> body,
            Principal principal
    ) {
        User user = userService.getUserByEmail(principal.getName());
        String address = (String) body.get("deliveryAddress");
        if (address != null) {
            user.setDeliveryAddress(address.trim());
        }
        if (body.containsKey("deliveryLat")) {
            Object latObj = body.get("deliveryLat");
            if (latObj instanceof Number) {
                user.setDeliveryLat(((Number) latObj).doubleValue());
            } else if (latObj == null) {
                user.setDeliveryLat(null);
            }
        }
        if (body.containsKey("deliveryLng")) {
            Object lngObj = body.get("deliveryLng");
            if (lngObj instanceof Number) {
                user.setDeliveryLng(((Number) lngObj).doubleValue());
            } else if (lngObj == null) {
                user.setDeliveryLng(null);
            }
        }
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }
}