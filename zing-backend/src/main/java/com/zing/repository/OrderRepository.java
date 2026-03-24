package com.zing.repository;

import com.zing.constants.OrderStatus;
import com.zing.model.Order;
import com.zing.model.Restaurant;
import com.zing.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // Orders for ONE restaurant
    List<Order> findByRestaurant(Restaurant restaurant);

    // Orders by restaurant id
    List<Order> findByRestaurantId(Long restaurantId);

    // Orders by status list (for delivery — available orders)
    List<Order> findByStatusIn(List<OrderStatus> statuses);

    // Count by status
    long countByStatus(OrderStatus status);

    // Orders assigned to a specific delivery partner
    List<Order> findByDeliveryPartner(User deliveryPartner);

    // Active deliveries for a partner (OUT_FOR_DELIVERY)
    List<Order> findByDeliveryPartnerAndStatus(User deliveryPartner, OrderStatus status);

    // Delivery partner history (specific statuses)
    List<Order> findByDeliveryPartnerAndStatusIn(User deliveryPartner, List<OrderStatus> statuses);

    // Count deliveries by partner and status
    long countByDeliveryPartnerAndStatus(User deliveryPartner, OrderStatus status);

    // Available orders (PREPARING, no delivery partner assigned yet)
    List<Order> findByStatusAndDeliveryPartnerIsNull(OrderStatus status);

    // Available orders with multiple statuses
    List<Order> findByStatusInAndDeliveryPartnerIsNull(List<OrderStatus> statuses);

    // User's own orders
    List<Order> findByUserEmail(String email);
}