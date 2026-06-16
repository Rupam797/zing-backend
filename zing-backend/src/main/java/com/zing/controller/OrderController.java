package com.zing.controller;

import com.zing.constants.OrderStatus;
import com.zing.dto.OrderRequest;
import com.zing.exception.BadRequestException;
import com.zing.exception.ResourceNotFoundException;
import com.zing.model.Order;
import com.zing.repository.OrderRepository;
import com.zing.service.NotificationService;
import com.zing.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;

    public OrderController(OrderService orderService,
                           OrderRepository orderRepository,
                           NotificationService notificationService) {
        this.orderService = orderService;
        this.orderRepository = orderRepository;
        this.notificationService = notificationService;
    }

    // 👤 User: view my orders
    @GetMapping("/my")
    public ResponseEntity<List<Order>> getMyOrders(Principal principal) {
        return ResponseEntity.ok(
                orderRepository.findByUserEmail(principal.getName())
        );
    }

    // 👤 User: view single order
    @GetMapping("/my/{id}")
    public ResponseEntity<Order> getMyOrder(@PathVariable Long id, Principal principal) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        return ResponseEntity.ok(order);
    }

    // 👤 User: place an order
    @PostMapping
    public ResponseEntity<Order> placeOrder(
            @RequestBody OrderRequest request,
            Principal principal
    ) {
        Order order = orderService.placeOrder(request, principal.getName());
        return ResponseEntity.ok(order);
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

    // ✅ Restaurant owner: accept order
    @PutMapping("/restaurant/{id}/accept")
    public ResponseEntity<Order> acceptOrder(@PathVariable Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (order.getStatus() != OrderStatus.PLACED) {
            throw new BadRequestException("Only PLACED orders can be accepted");
        }
        order.setStatus(OrderStatus.ACCEPTED);
        Order saved = orderRepository.save(order);
        broadcastStatusUpdate(saved);
        return ResponseEntity.ok(saved);
    }

    // ❌ Restaurant owner: reject (cancel) order
    @PutMapping("/restaurant/{id}/reject")
    public ResponseEntity<Order> rejectOrder(@PathVariable Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (order.getStatus() != OrderStatus.PLACED) {
            throw new BadRequestException("Only PLACED orders can be rejected");
        }
        order.setStatus(OrderStatus.CANCELLED);
        Order saved = orderRepository.save(order);
        broadcastStatusUpdate(saved);
        return ResponseEntity.ok(saved);
    }

    // 🍳 Restaurant owner: mark order as preparing
    @PutMapping("/restaurant/{id}/prepare")
    public ResponseEntity<Order> prepareOrder(@PathVariable Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (order.getStatus() != OrderStatus.ACCEPTED) {
            throw new BadRequestException("Only ACCEPTED orders can be marked as preparing");
        }
        order.setStatus(OrderStatus.PREPARING);
        Order saved = orderRepository.save(order);
        broadcastStatusUpdate(saved);
        return ResponseEntity.ok(saved);
    }

    // 📡 Broadcast order status change via WebSocket
    private void broadcastStatusUpdate(Order order) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("orderId", order.getId());
        payload.put("status", order.getStatus().name());
        payload.put("timestamp", System.currentTimeMillis());
        if (order.getDeliveryPartner() != null) {
            payload.put("partnerName", order.getDeliveryPartner().getName());
        }
        notificationService.notifyUser(
                "/topic/order-status/" + order.getId(), payload);
    }
}