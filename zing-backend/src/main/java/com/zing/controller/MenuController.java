package com.zing.controller;

import com.zing.model.MenuItem;
import com.zing.service.MenuService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menus")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @PostMapping("/{restaurantId}")
    public ResponseEntity<MenuItem> addMenuItem(
            @PathVariable Long restaurantId,
            @RequestBody MenuItem menuItem) {
        return ResponseEntity.ok(
                menuService.addMenuItem(restaurantId, menuItem)
        );
    }

    @GetMapping("/{restaurantId}")
    public ResponseEntity<List<MenuItem>> getMenu(
            @PathVariable Long restaurantId) {
        return ResponseEntity.ok(
                menuService.getMenuByRestaurant(restaurantId)
        );
    }
}