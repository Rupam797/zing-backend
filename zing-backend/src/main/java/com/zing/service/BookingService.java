package com.zing.service;

import com.zing.dto.BookingRequest;
import com.zing.model.Booking;

import java.util.List;

public interface BookingService {

    Booking createBooking(BookingRequest request, String userEmail);

    List<Booking> getBookingsForRestaurant(Long restaurantId);
}