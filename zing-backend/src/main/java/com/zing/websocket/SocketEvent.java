package com.zing.websocket;

public class SocketEvent {

    public static final String ORDER_CREATED = "ORDER_CREATED";
    public static final String ORDER_STATUS_UPDATED = "ORDER_STATUS_UPDATED";
    public static final String DELIVERY_LOCATION_UPDATED = "DELIVERY_LOCATION_UPDATED";

    private SocketEvent() {
        // prevent instantiation
    }
}