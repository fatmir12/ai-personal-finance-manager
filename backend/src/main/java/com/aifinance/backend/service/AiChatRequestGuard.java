package com.aifinance.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AiChatRequestGuard {
    private final Set<Long> activeConversations= ConcurrentHashMap.newKeySet();

    public void acquire(Long conversationId){
        boolean acquired=activeConversations.add(conversationId);

        if(!acquired){
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,"AI asistent već obrađuje poruku u ovom razgovoru"
            );
        }
    }
    public void release(Long conversationId){
        activeConversations.remove(conversationId);
    }
}
