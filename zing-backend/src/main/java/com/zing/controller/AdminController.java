package com.zing.controller;

import com.zing.dto.ApiResponse;
import com.zing.model.Role;
import com.zing.model.User;
import com.zing.repository.OrderRepository;
import com.zing.repository.RestaurantRepository;
import com.zing.repository.UserRepository;
import com.zing.exception.ResourceNotFoundException;
import com.zing.exception.BadRequestException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final OrderRepository orderRepository;

    public AdminController(
            UserRepository userRepository,
            RestaurantRepository restaurantRepository,
            OrderRepository orderRepository
    ) {
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
        this.orderRepository = orderRepository;
    }

    // ✅ Health check
    @GetMapping("/health")
    public ResponseEntity<ApiResponse> health() {
        return ResponseEntity.ok(
                new ApiResponse(true, "ZING backend is running")
        );
    }

    // 📊 System stats
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        Map<String, Object> data = new HashMap<>();
        data.put("totalUsers", userRepository.count());
        data.put("totalRestaurants", restaurantRepository.count());
        data.put("totalOrders", orderRepository.count());
        data.put("usersByRole", Map.of(
                "USER", userRepository.countByRole(Role.USER),
                "RESTAURANT", userRepository.countByRole(Role.RESTAURANT),
                "DELIVERY", userRepository.countByRole(Role.DELIVERY),
                "ADMIN", userRepository.countByRole(Role.ADMIN)
        ));
        return ResponseEntity.ok(data);
    }

    // 👥 List all users
    @GetMapping("/users")
    public ResponseEntity<List<User>> listUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // ❌ Delete user
    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        userRepository.delete(user);
        return ResponseEntity.ok(new ApiResponse(true, "User deleted"));
    }

    // 🔄 Change user role
    @PutMapping("/users/{id}/role")
    public ResponseEntity<User> changeRole(
            @PathVariable Long id,
            @RequestParam String role
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        try {
            user.setRole(Role.valueOf(role.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role: " + role);
        }
        return ResponseEntity.ok(userRepository.save(user));
    }
}