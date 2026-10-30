package com.aifinance.backend.controller;

import com.aifinance.backend.dto.NotificationResponse;
import com.aifinance.backend.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notificationService;
    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }
    @GetMapping
    public List<NotificationResponse> getMyNotifications(
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());
        return notificationService.getMyNotifications(userId);
    }
    @GetMapping("/unread-count")
    public Map<String,Long> getUnreadCount(@AuthenticationPrincipal Jwt jwt){
        Long userId=Long.valueOf(jwt.getSubject());
        long count=notificationService.getUnreadCount(userId);
        return Map.of("unreadCount",count);
    }
    @PatchMapping("/{id}/read")
    public NotificationResponse markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());
        return notificationService.markAsRead(id, userId);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());
        notificationService.deleteNotification(id, userId);
        return ResponseEntity.noContent().build();
    }
}
