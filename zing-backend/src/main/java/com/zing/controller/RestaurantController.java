package com.zing.controller;

import com.zing.model.Restaurant;
import com.zing.service.RestaurantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @PostMapping
    public ResponseEntity<Restaurant> createRestaurant(
            @RequestBody Restaurant restaurant) {
        return ResponseEntity.ok(
                restaurantService.createRestaurant(restaurant)
        );
    }

    @GetMapping
    public ResponseEntity<List<Restaurant>> getAllRestaurants() {
        return ResponseEntity.ok(
                restaurantService.getAllRestaurants()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Restaurant> getRestaurantById(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                restaurantService.getRestaurantById(id)
        );
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<List<Restaurant>> getByCity(
            @PathVariable String city) {
        return ResponseEntity.ok(
                restaurantService.getRestaurantsByCity(city)
        );
    }
}