package com.zing.controller;

import com.zing.dto.BookingRequest;
import com.zing.model.Booking;
import com.zing.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<Booking> createBooking(
            @RequestBody BookingRequest request,
            Principal principal) {
        return ResponseEntity.ok(
                bookingService.createBooking(request, principal.getName())
        );
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<Booking>> getBookings(
            @PathVariable Long restaurantId) {
        return ResponseEntity.ok(
                bookingService.getBookingsForRestaurant(restaurantId)
        );
    }
}