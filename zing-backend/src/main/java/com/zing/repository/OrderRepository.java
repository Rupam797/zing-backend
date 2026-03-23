package com.zing.repository;

import com.zing.constants.OrderStatus;
import com.zing.model.Order;
import com.zing.model.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // Orders for ONE restaurant
    List<Order> findByRestaurant(Restaurant restaurant);

    // (Optional) Orders by restaurant id
    List<Order> findByRestaurantId(Long restaurantId);

    // Orders by status list (for delivery)
    List<Order> findByStatusIn(List<OrderStatus> statuses);

    // Count by status
    long countByStatus(OrderStatus status);
}