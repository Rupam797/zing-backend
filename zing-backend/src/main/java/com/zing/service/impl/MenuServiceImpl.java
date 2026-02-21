package com.zing.service.impl;

import com.zing.model.MenuItem;
import com.zing.model.Restaurant;
import com.zing.repository.MenuRepository;
import com.zing.repository.RestaurantRepository;
import com.zing.service.MenuService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MenuServiceImpl implements MenuService {

    private final MenuRepository menuRepository;
    private final RestaurantRepository restaurantRepository;

    public MenuServiceImpl(MenuRepository menuRepository,
                           RestaurantRepository restaurantRepository) {
        this.menuRepository = menuRepository;
        this.restaurantRepository = restaurantRepository;
    }

    @Override
    public MenuItem addMenuItem(Long restaurantId, MenuItem menuItem) {

        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        menuItem.setRestaurant(restaurant);
        return menuRepository.save(menuItem);
    }

    @Override
    public List<MenuItem> getMenuByRestaurant(Long restaurantId) {

        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        return menuRepository.findByRestaurantAndAvailableTrue(restaurant);
    }
}