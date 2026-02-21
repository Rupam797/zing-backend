package com.zing.service;

import com.zing.model.MenuItem;

import java.util.List;

public interface MenuService {

    MenuItem addMenuItem(Long restaurantId, MenuItem menuItem);

    List<MenuItem> getMenuByRestaurant(Long restaurantId);
}