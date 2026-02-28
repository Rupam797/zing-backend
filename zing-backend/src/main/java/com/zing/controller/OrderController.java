package com.zing.controller;

import com.zing.model.Order;
import com.zing.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // 🏪 Restaurant owner: get their orders
    @GetMapping("/restaurant")
    public ResponseEntity<List<Order>> getRestaurantOrders(
            Principal principal
    ) {
        return ResponseEntity.ok(
                orderService.getOrdersForRestaurant(
                        principal.getName()
                )
        );
    }
}