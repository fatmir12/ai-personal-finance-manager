
package com.aifinance.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.databind.JsonNode;

import java.net.SocketTimeoutException;
import java.net.http.HttpTimeoutException;
import java.util.List;
import java.util.Map;

@Service
public class OllamaService {

    private final RestClient ollamaRestClient;
    private final String model;
    private final String keepAlive;

    public OllamaService(
            RestClient ollamaRestClient,
            @Value("${app.ollama.model}") String model,
            @Value("${app.ollama.keep-alive:30s}") String keepAlive
    ) {
        this.ollamaRestClient = ollamaRestClient;
        this.model = model;
        this.keepAlive = keepAlive;
    }

    // Slanje jednog pitanja bez historije
    public String ask(String question) {

        List<Map<String, String>> messages = List.of(
                Map.of(
                        "role", "system",
                        "content",
                        "Ti si AI finansijski asistent. " +
                                "Odgovaraj jasno i gramatički ispravno " +
                                "na bosanskom jeziku."
                ),
                Map.of(
                        "role", "user",
                        "content", question
                )
        );

        return askWithHistory(messages);
    }

    // Slanje pitanja s historijom razgovora
    public String askWithHistory(
            List<Map<String, String>> messages
    ) {

        // Zahtjev prema Ollama /api/chat endpointu
        Map<String, Object> request = Map.of(
                "model", model,
                "messages", messages,
                "stream", false,
                "keep_alive", keepAlive
        );

        try {

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

        } catch (ResourceAccessException ex) {

            if (isTimeout(ex)) {
                throw new ResponseStatusException(
                        HttpStatus.GATEWAY_TIMEOUT,
                        "AI asistent nije odgovorio na vrijeme",
                        ex
                );
            }

            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI asistent trenutno nije dostupan",
                    ex
            );

        } catch (RestClientResponseException ex) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Greška prilikom komunikacije s AI modelom",
                    ex
            );
        }
    }

    // Provjera je li uzrok greške timeout
    private boolean isTimeout(Throwable exception) {

        Throwable cause = exception;

        while (cause != null) {

            if (cause instanceof HttpTimeoutException ||
                    cause instanceof SocketTimeoutException) {
                return true;
            }

            cause = cause.getCause();
        }

        return false;
    }
}
