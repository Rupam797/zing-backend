package com.zing.service.impl;

import com.zing.exception.ResourceNotFoundException;
import com.zing.model.Restaurant;
import com.zing.model.User;
import com.zing.repository.RestaurantRepository;
import com.zing.repository.UserRepository;
import com.zing.service.RestaurantService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RestaurantServiceImpl implements RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    public RestaurantServiceImpl(
            RestaurantRepository restaurantRepository,
            UserRepository userRepository
    ) {
        this.restaurantRepository = restaurantRepository;
        this.userRepository = userRepository;
    }

    // ✅ Create restaurant (RESTAURANT role only)
    @Override
    public Restaurant createRestaurant(
            Restaurant restaurant,
            String ownerEmail
    ) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Owner not found"));

        restaurant.setOwner(owner);
        return restaurantRepository.save(restaurant);
    }

    // 🔓 Public / USER
    @Override
    public List<Restaurant> getAllRestaurants() {
        return restaurantRepository.findAll();
    }

    // 🔓 Public / USER
    @Override
    public Restaurant getRestaurantById(Long restaurantId) {
        return restaurantRepository.findById(restaurantId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Restaurant not found"));
    }

    // 🔓 Public / USER
    @Override
    public List<Restaurant> getRestaurantsByCity(String city) {
        return restaurantRepository.findByCity(city);
    }

    // 🏪 Restaurant owner – view own restaurants
    @Override
    public List<Restaurant> getMyRestaurants(String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Owner not found"));

        return restaurantRepository.findByOwner(owner);
    }
}