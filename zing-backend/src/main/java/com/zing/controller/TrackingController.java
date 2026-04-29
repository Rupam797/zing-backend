package com.zing.controller;

import com.zing.exception.ResourceNotFoundException;
import com.zing.model.Order;
import com.zing.repository.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Public-facing tracking endpoint for customers to fetch
 * the delivery partner's last known location.
 */
@RestController
@RequestMapping("/api/tracking")
public class TrackingController {

    private final OrderRepository orderRepository;

    public TrackingController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @GetMapping("/orders/{id}/location")
    public ResponseEntity<Map<String, Object>> getDeliveryLocation(@PathVariable Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("orderId", id);
        response.put("lat", order.getDeliveryLat());
        response.put("lng", order.getDeliveryLng());
        response.put("status", order.getStatus());
        response.put("partnerName", order.getDeliveryPartner() != null ? order.getDeliveryPartner().getName() : null);
        response.put("restaurantName", order.getRestaurant() != null ? order.getRestaurant().getName() : null);
        response.put("restaurantAddress", order.getRestaurant() != null ? order.getRestaurant().getAddress() : null);
        response.put("restaurantCity", order.getRestaurant() != null ? order.getRestaurant().getCity() : null);
        return ResponseEntity.ok(response);
    }
}
