package com.zing.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI zingOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("ZING API")
                        .description("Real-time Food Delivery Backend")
                        .version("1.0"));
    }
}