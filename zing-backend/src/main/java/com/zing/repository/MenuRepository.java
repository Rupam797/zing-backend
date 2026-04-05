package com.zing.repository;

import com.zing.model.MenuItem;
import com.zing.model.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MenuRepository extends JpaRepository<MenuItem, Long> {

    @Query("SELECT m FROM MenuItem m JOIN FETCH m.restaurant")
    List<MenuItem> findAllWithRestaurant();

    List<MenuItem> findByRestaurant(Restaurant restaurant);

    List<MenuItem> findByRestaurantAndAvailableTrue(Restaurant restaurant);
}