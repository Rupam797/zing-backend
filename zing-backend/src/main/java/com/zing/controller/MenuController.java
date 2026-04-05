package com.zing.controller;

import com.zing.model.MenuItem;
import com.zing.repository.MenuRepository;
import com.zing.service.MenuService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.zing.dto.MenuItemDTO;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/menus")
public class MenuController {

    private final MenuService menuService;
    private final MenuRepository menuRepository;

    public MenuController(MenuService menuService, MenuRepository menuRepository) {
        this.menuService = menuService;
        this.menuRepository = menuRepository;
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

    // 🏠 Homepage: all menu items (Optimized with Join Fetch & DTO)
    @GetMapping("/all")
    public ResponseEntity<List<MenuItemDTO>> getAllMenuItems() {
        List<MenuItemDTO> dtos = menuRepository.findAllWithRestaurant().stream()
                .map(item -> new MenuItemDTO(
                        item.getId(),
                        item.getName(),
                        item.getDescription(),
                        item.getPrice(),
                        item.isAvailable(),
                        item.getImageUrl(),
                        new MenuItemDTO.RestaurantSummaryDTO(
                                item.getRestaurant() != null ? item.getRestaurant().getId() : null,
                                item.getRestaurant() != null ? item.getRestaurant().getName() : "Unknown"
                        )
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}