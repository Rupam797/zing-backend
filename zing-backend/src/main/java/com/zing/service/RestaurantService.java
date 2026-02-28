package com.zing.service;

import com.zing.model.Restaurant;

import java.util.List;

public interface RestaurantService {

    Restaurant createRestaurant(Restaurant restaurant, String ownerEmail);

    List<Restaurant> getAllRestaurants();

    Restaurant getRestaurantById(Long restaurantId);

    List<Restaurant> getRestaurantsByCity(String city);

    List<Restaurant> getMyRestaurants(String ownerEmail);
}