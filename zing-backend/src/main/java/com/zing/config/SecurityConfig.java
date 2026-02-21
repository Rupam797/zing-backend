package com.zing.config;

import com.zing.model.Role;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {})
                .authorizeHttpRequests(auth -> auth

                        // Public APIs
                        .requestMatchers("/api/auth/**").permitAll()

                        // Admin only
                        .requestMatchers("/api/admin/**")
                        .hasAuthority(Role.ADMIN.name())

                        // Restaurant owner
                        .requestMatchers("/api/restaurants/**", "/api/menus/**")
                        .hasAuthority(Role.RESTAURANT.name())

                        // Delivery partner
                        .requestMatchers("/api/delivery/**")
                        .hasAuthority(Role.DELIVERY.name())

                        // Normal users
                        .requestMatchers("/api/orders/**", "/api/bookings/**")
                        .hasAuthority(Role.USER.name())

                        .anyRequest().authenticated()
                )
                .addFilterBefore(
                        new JwtConfig(),
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}