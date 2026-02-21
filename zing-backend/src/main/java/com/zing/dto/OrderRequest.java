package com.zing.dto;

import java.util.List;

public class OrderRequest {

    private Long restaurantId;
    private List<OrderItemRequest> items;

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
}