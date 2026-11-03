
package com.aifinance.backend.service;

import tools.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
public class OllamaService {

    private final RestClient ollamaRestClient;
    private final String model;

    public OllamaService(
            RestClient ollamaRestClient,
            @Value("${app.ollama.model}") String model
    ) {
        this.ollamaRestClient = ollamaRestClient;
        this.model = model;
    }

    public String ask(String question) {

        Map<String, Object> request = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of(
                                "role", "system",
                                "content", "Ti si AI finansijski asistent. " +
                                        "Odgovaraj na bosanskom jeziku."
                        ),
                        Map.of(
                                "role", "user",
                                "content", question
                        )
                ),
                "stream", false
        );

        JsonNode response = ollamaRestClient.post()
                .uri("/api/chat")
                .body(request)
                .retrieve()
                .body(JsonNode.class);

        if (response == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Ollama nije vratila odgovor"
            );
        }

        String answer = response.path("message")
                .path("content")
                .asText("");

        if (answer.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Ollama je vratila prazan odgovor"
            );
        }

        return answer;
    }
}
