package com.zing.repository;

import com.zing.model.Order;
import com.zing.model.Restaurant;
import com.zing.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUser(User user);

    List<Order> findByRestaurant(Restaurant restaurant);
}