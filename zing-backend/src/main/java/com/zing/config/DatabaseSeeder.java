package com.zing.config;

import com.zing.model.MenuItem;
import com.zing.model.Restaurant;
import com.zing.model.Role;
import com.zing.model.User;
import com.zing.repository.MenuRepository;
import com.zing.repository.RestaurantRepository;
import com.zing.repository.UserRepository;
import com.zing.util.PasswordUtil;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuRepository menuRepository;

    public DatabaseSeeder(UserRepository userRepository,
                          RestaurantRepository restaurantRepository,
                          MenuRepository menuRepository) {
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
        this.menuRepository = menuRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        seedRestaurantAndMenu(
                "mtr_owner@zing.com",
                "MTR Owner",
                "9888888801",
                "Mavalli Tiffin Room (MTR)",
                "14, Lalbagh Road, Mavalli, Bangalore",
                "Bangalore",
                12.9548,
                77.5838,
                "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=800",
                new MenuItemSeed[]{
                        new MenuItemSeed("Masala Dosa", "Golden crispy rice crepes filled with spiced potato mash, served with ghee and chutney.", 120.0, "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600"),
                        new MenuItemSeed("Rava Idli", "Steamed semolina cakes tempered with mustard seeds, curry leaves, and cashews, served with potato sagu.", 90.0, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600"),
                        new MenuItemSeed("Filter Coffee", "Authentic South Indian chicory-infused hot filter coffee.", 50.0, "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600")
                }
        );

        seedRestaurantAndMenu(
                "top_owner@zing.com",
                "Only Place Owner",
                "9888888802",
                "The Only Place",
                "13, Museum Road, Bangalore",
                "Bangalore",
                12.9734,
                77.6085,
                "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
                new MenuItemSeed[]{
                        new MenuItemSeed("Chateaubriand Supreme Steak", "Tender double fillet steak grilled to perfection, served with jacket potatoes and buttered vegetables.", 480.0, "https://images.unsplash.com/photo-1544025162-d76694265947?w=600"),
                        new MenuItemSeed("Apple Pie", "Classic American apple pie with a flaky crust and cinnamon apple filling.", 150.0, "https://images.unsplash.com/photo-1507226983735-a838615193b0?w=600"),
                        new MenuItemSeed("Lasagne", "Layers of fresh pasta, rich meat sauce, and creamy cheese baked to perfection.", 380.0, "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600")
                }
        );

        seedRestaurantAndMenu(
                "toit_owner@zing.com",
                "Toit Owner",
                "9888888803",
                "Toit Brewpub",
                "298, 100 Feet Road, Indiranagar, Bangalore",
                "Bangalore",
                12.9792,
                77.6408,
                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
                new MenuItemSeed[]{
                        new MenuItemSeed("Wood-Fired Spicy Garden Pizza", "Thin crust pizza topped with spicy jalapenos, bell peppers, onions, and fresh mozzarella.", 420.0, "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600"),
                        new MenuItemSeed("Toit BBQ Chicken Wings", "Crispy chicken wings glazed with signature smoky BBQ sauce.", 320.0, "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600"),
                        new MenuItemSeed("Beef Burger", "Juicy grilled beef patty with cheddar cheese, caramelized onions, and house burger sauce.", 390.0, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600")
                }
        );
    }

    private void seedRestaurantAndMenu(
            String ownerEmail, String ownerName, String ownerPhone,
            String restaurantName, String address, String city,
            Double latitude, Double longitude, String imageUrl,
            MenuItemSeed[] items
    ) {
        User owner = userRepository.findByEmail(ownerEmail).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(ownerEmail);
            newUser.setName(ownerName);
            newUser.setPhone(ownerPhone);
            newUser.setPassword(PasswordUtil.hashPassword("password123"));
            newUser.setRole(Role.RESTAURANT);
            return userRepository.save(newUser);
        });

        // Find or create restaurant owned by this owner
        Restaurant restaurant = restaurantRepository.findByOwner(owner).stream().findFirst().orElseGet(() -> {
            Restaurant newRes = new Restaurant();
            newRes.setName(restaurantName);
            newRes.setAddress(address);
            newRes.setCity(city);
            newRes.setLatitude(latitude);
            newRes.setLongitude(longitude);
            newRes.setOpen(true);
            newRes.setImageUrl(imageUrl);
            newRes.setOwner(owner);
            return restaurantRepository.save(newRes);
        });

        // Seed menu items
        for (MenuItemSeed itemSeed : items) {
            boolean itemExists = menuRepository.findByRestaurant(restaurant).stream()
                    .anyMatch(item -> item.getName().equalsIgnoreCase(itemSeed.name));
            if (!itemExists) {
                MenuItem newItem = new MenuItem();
                newItem.setName(itemSeed.name);
                newItem.setDescription(itemSeed.description);
                newItem.setPrice(itemSeed.price);
                newItem.setAvailable(true);
                newItem.setImageUrl(itemSeed.imageUrl);
                newItem.setRestaurant(restaurant);
                menuRepository.save(newItem);
            }
        }
    }

    private static class MenuItemSeed {
        String name;
        String description;
        double price;
        String imageUrl;

        MenuItemSeed(String name, String description, double price, String imageUrl) {
            this.name = name;
            this.description = description;
            this.price = price;
            this.imageUrl = imageUrl;
        }
    }
}
