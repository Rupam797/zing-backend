package com.zing.config;

import com.zing.model.Role;
import com.zing.util.JwtUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtUtil jwtUtil
    ) throws Exception {

        http
                .cors(org.springframework.security.config.Customizer.withDefaults())
                // JWT based → no CSRF
                .csrf(csrf -> csrf.disable())

                // Authorization rules
                .authorizeHttpRequests(auth -> auth

                        // 🔓 Public auth APIs
                        .requestMatchers("/api/auth/**").permitAll()

                        // 🔓 Swagger / OpenAPI
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/swagger-ui.html"
                        ).permitAll()

                        // 🔓 Public read-only APIs
                        .requestMatchers(HttpMethod.GET,
                                "/api/restaurants/**",
                                "/api/menus/**",
                                "/uploads/**"
                        ).permitAll()

                        // 📷 File uploads (any authenticated user)
                        .requestMatchers("/api/uploads/**").authenticated()

                        // 🏪 Restaurant owner APIs
                        .requestMatchers(HttpMethod.POST,
                                "/api/restaurants/**",
                                "/api/menus/**"
                        ).hasAuthority(Role.RESTAURANT.name())

                        .requestMatchers(HttpMethod.PUT,
                                "/api/restaurants/**",
                                "/api/menus/**"
                        ).hasAuthority(Role.RESTAURANT.name())

                        // 🏪 Restaurant → view & manage own orders
                        .requestMatchers("/api/orders/restaurant", "/api/orders/restaurant/**")
                        .hasAuthority(Role.RESTAURANT.name())

                        // 👤 User APIs
                        .requestMatchers("/api/orders/**", "/api/bookings/**")
                        .hasAuthority(Role.USER.name())

                        // 🚚 Delivery APIs
                        .requestMatchers("/api/delivery/**")
                        .hasAuthority(Role.DELIVERY.name())

                        // 📍 Delivery location read — accessible by customers tracking their order
                        .requestMatchers(HttpMethod.GET, "/api/tracking/**")
                        .hasAnyAuthority(Role.USER.name(), Role.DELIVERY.name())

                        // 🔌 WebSocket endpoints
                        .requestMatchers("/ws/**").permitAll()

                        // 👑 Admin APIs
                        .requestMatchers("/api/admin/**")
                        .hasAuthority(Role.ADMIN.name())

                        // 🔒 Everything else
                        .anyRequest().authenticated()
                )

                // JWT filter
                .addFilterBefore(
                        new JwtConfig(jwtUtil),
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}