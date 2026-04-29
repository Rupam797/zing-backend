package com.zing.websocket;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class DeliverySocketController {

    private final SimpMessagingTemplate messagingTemplate;

    public DeliverySocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Delivery partner sends their GPS location:
     * Client sends to: /app/delivery/location
     *
     * Payload must include:
     * {
     *   "orderId": 123,
     *   "lat": 22.5726,
     *   "lng": 88.3639,
     *   "heading": 45.0,
     *   "speed": 12.5,
     *   "accuracy": 10.0,
     *   "partnerId": 7,
     *   "partnerName": "John"
     * }
     *
     * Server broadcasts to: /topic/delivery-location/{orderId}
     */
    @MessageMapping("/delivery/location")
    public void broadcastLocation(Map<String, Object> locationPayload) {
        Object orderIdObj = locationPayload.get("orderId");
        if (orderIdObj == null) return;

        String orderId = orderIdObj.toString();

        // Add server timestamp
        locationPayload.put("timestamp", System.currentTimeMillis());

        // Broadcast to order-specific topic
        messagingTemplate.convertAndSend(
                "/topic/delivery-location/" + orderId,
                (Object) locationPayload
        );
    }
}