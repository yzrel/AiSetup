/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.config;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory sliding-window rate limiter for API abuse controls.
 */
public final class SlidingWindowRateLimiter {

    private final ConcurrentHashMap<String, Deque<Long>> windows = new ConcurrentHashMap<>();
    private final int maxRequests;
    private final long windowMillis;

    public SlidingWindowRateLimiter(int maxRequests, Duration window) {
        this.maxRequests = maxRequests;
        this.windowMillis = window.toMillis();
    }

    /** @return true if the request is allowed */
    public boolean tryAcquire(String key) {
        if (key == null || key.isBlank()) {
            return false;
        }
        long now = System.currentTimeMillis();
        Deque<Long> deque = windows.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (deque) {
            while (!deque.isEmpty() && now - deque.peekFirst() >= windowMillis) {
                deque.removeFirst();
            }
            if (deque.size() >= maxRequests) {
                return false;
            }
            deque.addLast(now);
            return true;
        }
    }

    /** Best-effort cleanup for idle keys (optional; maps stay bounded by traffic). */
    public void evictIdle() {
        long now = System.currentTimeMillis();
        Iterator<Map.Entry<String, Deque<Long>>> it = windows.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, Deque<Long>> entry = it.next();
            Deque<Long> deque = entry.getValue();
            synchronized (deque) {
                while (!deque.isEmpty() && now - deque.peekFirst() >= windowMillis) {
                    deque.removeFirst();
                }
                if (deque.isEmpty()) {
                    it.remove();
                }
            }
        }
    }
}
