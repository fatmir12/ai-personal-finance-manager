package com.aifinance.backend.repository;

import com.aifinance.backend.entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {
    List<AiConversation> findByUser_IdOrderByUpdatedAtDescIdDesc(Long userId);
    Optional<AiConversation> findByIdAndUser_Id(
            Long conversationId,
            Long userId
    );
}
