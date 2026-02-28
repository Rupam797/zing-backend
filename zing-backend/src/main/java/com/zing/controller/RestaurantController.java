package com.zing.controller;

import com.zing.model.Restaurant;
import com.zing.service.RestaurantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    // 🏪 Create restaurant (RESTAURANT role)
    @PostMapping
    public ResponseEntity<Restaurant> createRestaurant(
            @RequestBody Restaurant restaurant,
            Principal principal
    ) {
        return ResponseEntity.ok(
                restaurantService.createRestaurant(
                        restaurant,
                        principal.getName()
                )
        );
    }

    // 🔓 Public / USER
    @GetMapping
    public ResponseEntity<List<Restaurant>> getAllRestaurants() {
        return ResponseEntity.ok(
                restaurantService.getAllRestaurants()
        );
    }

    // 🔓 Public / USER
    @GetMapping("/{id}")
    public ResponseEntity<Restaurant> getRestaurantById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                restaurantService.getRestaurantById(id)
        );
    }

    // 🔓 Public / USER
    @GetMapping("/city/{city}")
    public ResponseEntity<List<Restaurant>> getByCity(
            @PathVariable String city
    ) {
        return ResponseEntity.ok(
                restaurantService.getRestaurantsByCity(city)
        );
    }

    // 🏪 Restaurant owner – view own restaurants
    @GetMapping("/my")
    public ResponseEntity<List<Restaurant>> myRestaurants(
            Principal principal
    ) {
        return ResponseEntity.ok(
                restaurantService.getMyRestaurants(principal.getName())
        );
    }
}