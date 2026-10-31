package com.aifinance.backend.service;

import com.aifinance.backend.dto.AiConversationRequest;
import com.aifinance.backend.dto.AiConversationResponse;
import com.aifinance.backend.entity.AiConversation;
import com.aifinance.backend.entity.User;
import com.aifinance.backend.repository.AiConversationRepository;
import com.aifinance.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class AiConversationService {
    private final AiConversationRepository conversationRepository;
    private final UserRepository userRepository;

    public AiConversationService(AiConversationRepository conversationRepository, UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public AiConversationResponse createConversation(
            AiConversationRequest request,
            Long userId
    ){
        User user=userRepository.findById(userId)
                .orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND,"Korisnik nije pronađen"));
        LocalDateTime now=LocalDateTime.now(ZoneOffset.UTC);

        AiConversation conversation=new AiConversation();
        conversation.setUser(user);
        conversation.setTitle(request.title().trim());
        conversation.setCreatedAt(now);
        conversation.setUpdatedAt(now);

        AiConversation saved=conversationRepository.save(conversation);
        return toResponse(saved);
    }
    @Transactional(readOnly = true)
    public List<AiConversationResponse> getConversationForUser(Long userId){
        return conversationRepository
                .findByUser_IdOrderByUpdatedAtDescIdDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }
    @Transactional(readOnly = true)
    public AiConversationResponse getConversationById(Long conversationId, Long userId){
        AiConversation conversation=findOwnedConversation(
                conversationId,userId
        );
        return toResponse(conversation);
    }
    @Transactional
    public AiConversationResponse updateConversation(
            Long conversationId,
            AiConversationRequest request,
            Long userId
    ){
        AiConversation conversation=findOwnedConversation(conversationId,userId);
            conversation.setTitle(request.title().trim());
            conversation.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
            AiConversation saved=conversationRepository.save(conversation);
            return toResponse(saved);
    }
    @Transactional
    public void deleteConversation(Long conversationId, Long userId){
        AiConversation conversation=findOwnedConversation(conversationId,userId);
        conversationRepository.delete(conversation);
    }
    private AiConversation findOwnedConversation(Long conversationId, Long userId){
        return conversationRepository
                .findByIdAndUser_Id(conversationId,userId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"AI razgovor nije pronađen"));
    }
    private AiConversationResponse toResponse(AiConversation conversation){
        return new AiConversationResponse(
                conversation.getId(),
                conversation.getTitle(),
                conversation.getCreatedAt(),
                conversation.getUpdatedAt()
        );
    }


}
