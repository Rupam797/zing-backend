package com.zing.service;

public interface NotificationService {

    void notifyUser(String destination, Object payload);

    void notifyRestaurant(String destination, Object payload);
}