package com.aifinance.backend.service;

import com.aifinance.backend.dto.NotificationResponse;
import com.aifinance.backend.entity.Notification;
import com.aifinance.backend.entity.User;
import com.aifinance.backend.repository.NotificationRepository;
import org.aspectj.weaver.ast.Not;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(Long userId) {
        return notificationRepository
                .findByUser_IdOrderByCreatedAtDescIdDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUser_IdAndReadFalse(userId);
    }
    @Transactional
    public NotificationResponse markAsRead(Long notificationId,Long userId) {
        Notification notification=notificationRepository
                .findById(notificationId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Notifikacija nije pronađena"));
        if(notification.getUser().getId()!=userId){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Notifikacija nije pronađena");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
        return toResponse(notification);
    }

    @Transactional
    public void deleteNotification(Long notificationId,Long userId) {
        Notification notification=notificationRepository
                .findById(notificationId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Notifikacija nije pronađena"));
        if(notification.getUser().getId()!=userId){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Notifikacija nije pronađena");
        }
        notificationRepository.delete(notification);
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }

    @Transactional
    public void createNotification(
            User user,
            String title,
            String message,
            String type
    ){
        Notification notification=new Notification();

        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));

        notificationRepository.save(notification);
    }
}
