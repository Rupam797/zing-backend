import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';

const WS_URL = (import.meta.env.VITE_API_URL || '') + '/ws';

/**
 * Custom React hook for STOMP WebSocket connections.
 * Provides subscribe/send capabilities with auto-reconnect.
 *
 * @param {Object} options
 * @param {boolean} options.enabled - Whether to connect (default: true)
 * @param {number} options.reconnectDelay - Reconnect delay in ms (default: 3000)
 */
export default function useStompClient({ enabled = true, reconnectDelay = 3000 } = {}) {
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected | connecting | connected | error
  const clientRef = useRef(null);
  const subscriptionsRef = useRef(new Map());

  useEffect(() => {
    if (!enabled) {
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connecting');

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      onConnect: () => {
        setConnectionStatus('connected');
        // Re-subscribe all active subscriptions after reconnect
        subscriptionsRef.current.forEach((sub) => {
          if (sub.destination && sub.callback) {
            const stompSub = client.subscribe(sub.destination, (message) => {
              try {
                const body = JSON.parse(message.body);
                sub.callback(body);
              } catch {
                sub.callback(message.body);
              }
            });
            sub.stompSub = stompSub;
          }
        });
      },

      onDisconnect: () => {
        setConnectionStatus('disconnected');
      },

      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers?.message || frame);
        setConnectionStatus('error');
      },

      onWebSocketError: () => {
        setConnectionStatus('error');
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      subscriptionsRef.current.forEach((sub) => {
        if (sub.stompSub) {
          try { sub.stompSub.unsubscribe(); } catch {}
        }
      });
      subscriptionsRef.current.clear();
      if (client.active) {
        client.deactivate();
      }
      clientRef.current = null;
    };
  }, [enabled, reconnectDelay]);

  /**
   * Subscribe to a STOMP destination.
   * Returns an unsubscribe function.
   */
  const subscribe = useCallback((destination, callback) => {
    const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const subInfo = { destination, callback, stompSub: null };

    // If already connected, subscribe immediately
    if (clientRef.current?.connected) {
      const stompSub = clientRef.current.subscribe(destination, (message) => {
        try {
          const body = JSON.parse(message.body);
          callback(body);
        } catch {
          callback(message.body);
        }
      });
      subInfo.stompSub = stompSub;
    }

    subscriptionsRef.current.set(id, subInfo);

    // Return unsubscribe function
    return () => {
      const sub = subscriptionsRef.current.get(id);
      if (sub?.stompSub) {
        try { sub.stompSub.unsubscribe(); } catch {}
      }
      subscriptionsRef.current.delete(id);
    };
  }, []);

  /**
   * Send a message to a STOMP destination.
   */
  const send = useCallback((destination, body) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination,
        body: typeof body === 'string' ? body : JSON.stringify(body),
      });
      return true;
    }
    return false;
  }, []);

  return { connectionStatus, subscribe, send };
}
