package com.zing.websocket;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class DeliverySocketController {

    /**
     * Client sends:
     * /app/delivery/location
     *
     * Broadcasts:
     * /topic/delivery-location
     */
    @MessageMapping("/delivery/location")
    @SendTo("/topic/delivery-location")
    public Map<String, Object> broadcastLocation(
            Map<String, Object> locationPayload) {

        return locationPayload;
    }
}