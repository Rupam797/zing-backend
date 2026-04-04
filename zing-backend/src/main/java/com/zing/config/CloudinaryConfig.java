package com.zing.config;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class CloudinaryConfig {

    @Value("${cloudinary.url}")
    private String cloudinaryUrl;

    @Bean
    public Cloudinary cloudinary() {
        if (cloudinaryUrl != null && !cloudinaryUrl.isEmpty()) {
            return new Cloudinary(cloudinaryUrl);
        }
        
        // Fallback for missing configure, return an empty Cloudinary instance or log a warning
        // It's better to provide a dummy config so the context loads successfully
        Map<String, String> config = new HashMap<>();
        config.put("cloud_name", "dummy");
        config.put("api_key", "dummy");
        config.put("api_secret", "dummy");
        return new Cloudinary(config);
    }
}
