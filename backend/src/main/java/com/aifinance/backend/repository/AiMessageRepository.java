package com.aifinance.backend.repository;

import com.aifinance.backend.entity.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiMessageRepository extends JpaRepository<AiMessage,Long> {
    List<AiMessage> findByConversation_IdOrderByCreatedAtAscIdAsc(Long conversationId);
}
