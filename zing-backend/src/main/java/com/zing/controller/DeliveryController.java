package com.zing.controller;

import com.zing.constants.OrderStatus;
import com.zing.dto.ApiResponse;
import com.zing.exception.BadRequestException;
import com.zing.exception.ResourceNotFoundException;
import com.zing.model.Order;
import com.zing.repository.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery")
public class DeliveryController {

    private final OrderRepository orderRepository;

    public DeliveryController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    // 📦 Get orders ready for delivery (ACCEPTED or PREPARING status)
    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getAvailableOrders() {
        List<Order> orders = orderRepository.findByStatusIn(
                List.of(OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.OUT_FOR_DELIVERY)
        );
        return ResponseEntity.ok(orders);
    }

    // ✅ Accept a delivery
    @PutMapping("/orders/{id}/accept")
    public ResponseEntity<Order> acceptDelivery(@PathVariable Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.PREPARING && order.getStatus() != OrderStatus.ACCEPTED) {
            throw new BadRequestException("Order is not available for delivery");
        }

        order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
        return ResponseEntity.ok(orderRepository.save(order));
    }

    // 🔄 Mark delivery as complete
    @PutMapping("/orders/{id}/deliver")
    public ResponseEntity<Order> markDelivered(@PathVariable Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.OUT_FOR_DELIVERY) {
            throw new BadRequestException("Order is not out for delivery");
        }

        order.setStatus(OrderStatus.DELIVERED);
        return ResponseEntity.ok(orderRepository.save(order));
    }

    // 📊 Delivery stats
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse> stats() {
        long delivered = orderRepository.countByStatus(OrderStatus.DELIVERED);
        long active = orderRepository.countByStatus(OrderStatus.OUT_FOR_DELIVERY);
        return ResponseEntity.ok(
                new ApiResponse(true, "Delivered: " + delivered + ", Active: " + active)
        );
    }
}
