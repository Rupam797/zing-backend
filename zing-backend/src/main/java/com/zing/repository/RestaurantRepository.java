package com.zing.repository;

import com.zing.model.Restaurant;
import com.zing.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    List<Restaurant> findByCity(String city);

    List<Restaurant> findByOwner(User owner);
}