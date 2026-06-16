package com.zing.dto;

import java.util.List;

public class OrderRequest {

    private Long restaurantId;
    private List<OrderItemRequest> items;
    private String deliveryAddress;
    private Double customerLat;
    private Double customerLng;

    public OrderRequest() {}

    public Long getRestaurantId() {
        return restaurantId;
    }

    public void setRestaurantId(Long restaurantId) {
        this.restaurantId = restaurantId;
    }

    public List<OrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<OrderItemRequest> items) {
        this.items = items;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public Double getCustomerLat() {
        return customerLat;
    }

    public void setCustomerLat(Double customerLat) {
        this.customerLat = customerLat;
    }

    public Double getCustomerLng() {
        return customerLng;
    }

    public void setCustomerLng(Double customerLng) {
        this.customerLng = customerLng;
    }
}