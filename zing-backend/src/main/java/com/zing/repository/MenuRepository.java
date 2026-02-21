package com.zing.repository;

import com.zing.model.MenuItem;
import com.zing.model.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuRepository extends JpaRepository<MenuItem, Long> {

    List<MenuItem> findByRestaurant(Restaurant restaurant);

    List<MenuItem> findByRestaurantAndAvailableTrue(Restaurant restaurant);
}