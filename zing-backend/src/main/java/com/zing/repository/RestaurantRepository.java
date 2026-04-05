package com.zing.repository;

import com.zing.model.Restaurant;
import com.zing.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    @Query("SELECT r FROM Restaurant r JOIN FETCH r.owner")
    List<Restaurant> findAllWithOwner();

    List<Restaurant> findByCity(String city);

    List<Restaurant> findByOwner(User owner);
}