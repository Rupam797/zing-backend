package com.zing.websocket;

import com.zing.constants.OrderStatus;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class OrderSocketController {

    /**
     * Client sends message to:
     * /app/order/status
     *
     * Server broadcasts to:
     * /topic/order-status
     */
    @MessageMapping("/order/status")
    @SendTo("/topic/order-status")
    public OrderStatus sendOrderStatus(OrderStatus status) {
        return status;
    }
}