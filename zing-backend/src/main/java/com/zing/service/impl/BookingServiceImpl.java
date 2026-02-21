package com.zing.service.impl;

import com.zing.constants.BookingStatus;
import com.zing.dto.BookingRequest;
import com.zing.model.Booking;
import com.zing.model.Restaurant;
import com.zing.model.User;
import com.zing.repository.BookingRepository;
import com.zing.repository.RestaurantRepository;
import com.zing.repository.UserRepository;
import com.zing.service.BookingService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;

    public BookingServiceImpl(BookingRepository bookingRepository,
                              UserRepository userRepository,
                              RestaurantRepository restaurantRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
    }

    @Override
    public Booking createBooking(BookingRequest request, String userEmail) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setRestaurant(restaurant);
        booking.setBookingDate(request.getBookingDate());
        booking.setBookingTime(request.getBookingTime());
        booking.setPeopleCount(request.getPeopleCount());
        booking.setStatus(BookingStatus.REQUESTED);

        return bookingRepository.save(booking);
    }

    @Override
    public List<Booking> getBookingsForRestaurant(Long restaurantId) {

        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        return bookingRepository.findByRestaurantAndBookingDate(
                restaurant, null
        );
    }
}