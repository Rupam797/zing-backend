package com.zing.service;

import com.zing.dto.OrderRequest;
import com.zing.dto.OrderResponse;

import java.util.List;

public interface OrderService {

    OrderResponse placeOrder(OrderRequest request, String userEmail);

    OrderResponse getOrderById(Long orderId);

    List<OrderResponse> getOrdersForUser(String userEmail);

    void updateOrderStatus(Long orderId, String status);
}