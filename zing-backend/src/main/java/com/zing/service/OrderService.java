package com.zing.service;

import com.zing.dto.OrderRequest;
import com.zing.model.Order;

import java.util.List;

public interface OrderService {

    Order placeOrder(OrderRequest request, String userEmail);

    List<Order> getOrdersForRestaurant(String ownerEmail);
}