package com.zing.service.impl;

import com.zing.exception.ResourceNotFoundException;
import com.zing.model.Order;
import com.zing.model.Restaurant;
import com.zing.model.User;
import com.zing.repository.OrderRepository;
import com.zing.repository.RestaurantRepository;
import com.zing.repository.UserRepository;
import com.zing.service.OrderService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    public OrderServiceImpl(
            OrderRepository orderRepository,
            RestaurantRepository restaurantRepository,
            UserRepository userRepository
    ) {
        this.orderRepository = orderRepository;
        this.restaurantRepository = restaurantRepository;
        this.userRepository = userRepository;
    }

    @Override
    public List<Order> getOrdersForRestaurant(String ownerEmail) {

        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Owner not found"));

        // All restaurants owned by this user
        List<Restaurant> restaurants =
                restaurantRepository.findByOwner(owner);

        List<Order> orders = new ArrayList<>();

        for (Restaurant restaurant : restaurants) {
            orders.addAll(
                    orderRepository.findByRestaurant(restaurant)
            );
        }

        return orders;
    }
}