package com.zing.controller;

import com.zing.constants.OrderStatus;
import com.zing.exception.BadRequestException;
import com.zing.exception.ResourceNotFoundException;
import com.zing.model.Order;
import com.zing.model.User;
import com.zing.repository.OrderRepository;
import com.zing.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/delivery")
public class DeliveryController {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public DeliveryController(OrderRepository orderRepository, UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    private User getPartner(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    // 📦 Available orders (PREPARING & not yet assigned to any partner)
    @GetMapping("/available")
    public ResponseEntity<List<Order>> getAvailableOrders() {
        List<Order> orders = orderRepository.findByStatusInAndDeliveryPartnerIsNull(
                List.of(OrderStatus.ACCEPTED, OrderStatus.PREPARING)
        );
        return ResponseEntity.ok(orders);
    }

    // 🚛 My active deliveries (picked up, in transit)
    @GetMapping("/active")
    public ResponseEntity<List<Order>> getMyActiveDeliveries(Principal principal) {
        User partner = getPartner(principal);
        List<Order> orders = orderRepository.findByDeliveryPartnerAndStatus(
                partner, OrderStatus.OUT_FOR_DELIVERY
        );
        return ResponseEntity.ok(orders);
    }

    // 📜 My delivery history (completed)
    @GetMapping("/history")
    public ResponseEntity<List<Order>> getMyHistory(Principal principal) {
        User partner = getPartner(principal);
        List<Order> orders = orderRepository.findByDeliveryPartnerAndStatusIn(
                partner, List.of(OrderStatus.DELIVERED)
        );
        return ResponseEntity.ok(orders);
    }

    // ✅ Pick up order — assign to current delivery partner
    @PutMapping("/orders/{id}/pickup")
    public ResponseEntity<Order> pickupOrder(@PathVariable Long id, Principal principal) {
        User partner = getPartner(principal);
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.PREPARING && order.getStatus() != OrderStatus.ACCEPTED) {
            throw new BadRequestException("Order is not ready for pickup");
        }
        if (order.getDeliveryPartner() != null) {
            throw new BadRequestException("Order is already assigned to another delivery partner");
        }

        order.setDeliveryPartner(partner);
        order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
        return ResponseEntity.ok(orderRepository.save(order));
    }

    // 🏁 Mark as delivered
    @PutMapping("/orders/{id}/deliver")
    public ResponseEntity<Order> markDelivered(@PathVariable Long id, Principal principal) {
        User partner = getPartner(principal);
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.OUT_FOR_DELIVERY) {
            throw new BadRequestException("Order is not out for delivery");
        }
        if (order.getDeliveryPartner() == null || !order.getDeliveryPartner().getId().equals(partner.getId())) {
            throw new BadRequestException("This order is not assigned to you");
        }

        order.setStatus(OrderStatus.DELIVERED);
        order.setDeliveredAt(LocalDateTime.now());
        return ResponseEntity.ok(orderRepository.save(order));
    }

    // 📊 My stats
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getMyStats(Principal principal) {
        User partner = getPartner(principal);

        long delivered = orderRepository.countByDeliveryPartnerAndStatus(partner, OrderStatus.DELIVERED);
        long active = orderRepository.countByDeliveryPartnerAndStatus(partner, OrderStatus.OUT_FOR_DELIVERY);

        // Calculate earnings (delivery fee = 10% of order total, min ₹30)
        List<Order> completedOrders = orderRepository.findByDeliveryPartnerAndStatusIn(
                partner, List.of(OrderStatus.DELIVERED)
        );
        double totalEarnings = completedOrders.stream()
                .mapToDouble(o -> Math.max(30, o.getTotalAmount() * 0.10))
                .sum();

        // Available orders count
        long available = orderRepository.findByStatusInAndDeliveryPartnerIsNull(
                List.of(OrderStatus.ACCEPTED, OrderStatus.PREPARING)
        ).size();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalDelivered", delivered);
        stats.put("activeDeliveries", active);
        stats.put("availableOrders", available);
        stats.put("totalEarnings", totalEarnings);

        return ResponseEntity.ok(stats);
    }

    // 📍 Update delivery partner's live GPS location (persisted for reconnection)
    @PutMapping("/orders/{id}/location")
    public ResponseEntity<Map<String, Object>> updateLocation(
            @PathVariable Long id,
            @RequestBody Map<String, Double> coords,
            Principal principal
    ) {
        User partner = getPartner(principal);
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getDeliveryPartner() == null || !order.getDeliveryPartner().getId().equals(partner.getId())) {
            throw new BadRequestException("This order is not assigned to you");
        }

        Double lat = coords.get("lat");
        Double lng = coords.get("lng");
        if (lat != null && lng != null) {
            order.setDeliveryLat(lat);
            order.setDeliveryLng(lng);
            orderRepository.save(order);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("orderId", id);
        response.put("lat", lat);
        response.put("lng", lng);
        response.put("updatedAt", LocalDateTime.now());
        return ResponseEntity.ok(response);
    }

    // 📍 Get delivery partner's last known location (for customer page load / reconnection)
    @GetMapping("/orders/{id}/location")
    public ResponseEntity<Map<String, Object>> getLocation(@PathVariable Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("orderId", id);
        response.put("lat", order.getDeliveryLat());
        response.put("lng", order.getDeliveryLng());
        response.put("status", order.getStatus());
        response.put("partnerName", order.getDeliveryPartner() != null ? order.getDeliveryPartner().getName() : null);
        return ResponseEntity.ok(response);
    }
}
