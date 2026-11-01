package com.aifinance.backend.service;

import com.aifinance.backend.dto.AiMessageRequest;
import com.aifinance.backend.dto.AiMessageResponse;
import com.aifinance.backend.entity.AiConversation;
import com.aifinance.backend.entity.AiMessage;
import com.aifinance.backend.repository.AiConversationRepository;
import com.aifinance.backend.repository.AiMessageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class AiMessageService {
    private final AiMessageRepository messageRepository;
    private final AiConversationRepository conversationRepository;
    public AiMessageService(AiMessageRepository messageRepository, AiConversationRepository conversationRepository) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
    }

    @Transactional
    public AiMessageResponse sendMessage(
            Long conversationId,
            AiMessageRequest request,
            Long userId
    ){
        AiConversation conversation = findOwnedConversation(
                conversationId,userId
        );
        LocalDateTime now=LocalDateTime.now(ZoneOffset.UTC);

        AiMessage message = new AiMessage();
        message.setConversation(conversation);
        message.setRole("USER");
        message.setContent(request.content().trim());
        message.setCreatedAt(now);

        AiMessage saved=messageRepository.save(message);

        conversation.setUpdatedAt(now);
        return toResponse(saved);
    }
    @Transactional(readOnly = true)
    public List<AiMessageResponse> getConversationMessages(
            Long conversationId,
            Long userId
    ){
        findOwnedConversation(conversationId,userId);

        return messageRepository
                .findByConversation_IdOrderByCreatedAtAscIdAsc(conversationId)
                .stream()
                .map(this::toResponse)
                .toList();
    }
    private AiConversation findOwnedConversation(
            Long conversationId,
            Long userId
    ){
        return conversationRepository
                .findByIdAndUser_Id(conversationId,userId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"AI razgovor nije pronađen"));
    }
    private AiMessageResponse toResponse(AiMessage message){
        return new AiMessageResponse(
                message.getId(),
                message.getConversation().getId(),
                message.getRole(),
                message.getContent(),
                message.getCreatedAt()
        );
    }
}
