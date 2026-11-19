package com.aifinance.backend.service;

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

@Service
public class AiChatPersistenceService {
    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    public AiChatPersistenceService(AiConversationRepository conversationRepository, AiMessageRepository messageRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
    }
    @Transactional
    public AiMessage saveChat(
            Long conversationId,
            Long userId,
            String question,
            String answer
    ){
        AiConversation conversation = conversationRepository
                .findByIdAndUser_Id(conversationId, userId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND, "Ai razgovor nije pronađen"));
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        AiMessage userMessage=new AiMessage();
        userMessage.setConversation(conversation);
        userMessage.setRole("USER");
        userMessage.setContent(question);
        userMessage.setCreatedAt(now);

        messageRepository.save(userMessage);

        AiMessage assistantMessage=new AiMessage();
        assistantMessage.setConversation(conversation);
        assistantMessage.setRole("ASSISTANT");
        assistantMessage.setContent(answer);
        assistantMessage.setCreatedAt(now);

        AiMessage savedAssistantMessage=messageRepository.save(assistantMessage);

        conversation.setUpdatedAt(now);
        return savedAssistantMessage;

    }
}
