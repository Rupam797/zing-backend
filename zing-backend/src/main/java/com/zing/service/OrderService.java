package com.zing.service;

import com.zing.model.Order;

import java.util.List;

public interface OrderService {

    List<Order> getOrdersForRestaurant(String ownerEmail);
}