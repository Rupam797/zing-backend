package com.zing.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemDTO {
    private Long id;
    private String name;
    private String description;
    private double price;
    private boolean available;
    private String imageUrl;
    private RestaurantSummaryDTO restaurant;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RestaurantSummaryDTO {
        private Long id;
        private String name;
    }
}
