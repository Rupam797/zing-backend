package com.zing.repository;

import com.zing.model.Booking;
import com.zing.model.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByRestaurantAndBookingDate(
            Restaurant restaurant,
            LocalDate bookingDate
    );
}