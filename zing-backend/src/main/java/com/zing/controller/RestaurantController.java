package com.zing.controller;

import com.zing.model.Restaurant;
import com.zing.service.RestaurantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

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

    // 📍 Get restaurants sorted by distance from user's location
    @GetMapping("/nearby")
    public ResponseEntity<List<Map<String, Object>>> getNearbyRestaurants(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "50") double radiusKm
    ) {
        List<Restaurant> all = restaurantService.getAllRestaurants();
        List<Map<String, Object>> result = new java.util.ArrayList<>();

        for (Restaurant r : all) {
            double dist;
            if (r.getLatitude() != null && r.getLongitude() != null) {
                dist = haversineKm(lat, lng, r.getLatitude(), r.getLongitude());
            } else {
                dist = -1; // unknown location
            }

            if (dist <= radiusKm || dist < 0) {
                Map<String, Object> entry = new java.util.LinkedHashMap<>();
                entry.put("restaurant", r);
                entry.put("distanceKm", dist >= 0 ? Math.round(dist * 10.0) / 10.0 : null);
                result.add(entry);
            }
        }

        // Sort: restaurants with known location first (by distance), unknown last
        result.sort((a, b) -> {
            Double da = (Double) a.get("distanceKm");
            Double db = (Double) b.get("distanceKm");
            if (da == null && db == null) return 0;
            if (da == null) return 1;
            if (db == null) return -1;
            return Double.compare(da, db);
        });

        return ResponseEntity.ok(result);
    }

    // Haversine formula for distance in km
    private double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}