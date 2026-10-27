package com.aifinance.backend.service;

import com.aifinance.backend.dto.TransactionRequest;
import com.aifinance.backend.dto.TransactionResponse;
import com.aifinance.backend.entity.Category;
import com.aifinance.backend.entity.Transaction;
import com.aifinance.backend.entity.User;
import com.aifinance.backend.repository.CategoryRepository;
import com.aifinance.backend.repository.TransactionRepository;
import com.aifinance.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class TransactionService {
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public TransactionService(TransactionRepository transactionRepository, CategoryRepository categoryRepository, UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }
    @Transactional
    public TransactionResponse createTransaction(TransactionRequest request, Long userId){
        User user = userRepository.findById(userId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Korisnik nije pronađen"));
        Category category=categoryRepository.findById(request.categoryId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Kategorija nije pronađena"));
        if(category.getUser()!=null && category.getUser().getId()!=userId){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Kategorija nije pronađena");
        }

        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setCategory(category);
        transaction.setAmount(request.amount());
        transaction.setDescription(request.description());
        transaction.setTransactionDate(request.transactionDate());
        transaction.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));

        Transaction saved=transactionRepository.save(transaction);
        return new TransactionResponse(
                saved.getId(),
                category.getId(),
                category.getName(),
                category.getType(),
                saved.getAmount(),
                saved.getDescription(),
                saved.getTransactionDate(),
                saved.getCreatedAt()
        );
    }
    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactionsForUser(Long userId){
        return transactionRepository
                .findByUser_IdOrderByTransactionDateDescIdDesc(userId)
                .stream()
                .map(transaction -> new TransactionResponse(
                        transaction.getId(),
                        transaction.getCategory().getId(),
                        transaction.getCategory().getName(),
                        transaction.getCategory().getType(),
                        transaction.getAmount(),
                        transaction.getDescription(),
                        transaction.getTransactionDate(),
                        transaction.getCreatedAt()
                )).toList();
    }

    @Transactional
    public TransactionResponse updateTransaction(Long transactionId, TransactionRequest request, Long userId){
        Transaction transaction=transactionRepository
                .findById(transactionId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Transakcija nije pronađena"));

        if(transaction.getUser().getId()!=userId){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Transakcija nije pronađena");
        }
        Category category = categoryRepository
                .findById(request.categoryId())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Kategorija nije pronađena"));

        if(category.getUser()!=null && category.getUser().getId()!=userId){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Kategorija nije pronađena");
        }

        transaction.setCategory(category);
        transaction.setAmount(request.amount());
        transaction.setDescription(request.description());
        transaction.setTransactionDate(request.transactionDate());

        Transaction saved=transactionRepository.save(transaction);

        return new TransactionResponse(
                saved.getId(),
                category.getId(),
                category.getName(),
                category.getType(),
                saved.getAmount(),
                saved.getDescription(),
                saved.getTransactionDate(),
                saved.getCreatedAt()
        );
    }
    @Transactional
    public void deleteTransaction(Long transactionId, Long userId){
        Transaction transaction=transactionRepository
                .findById(transactionId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Transakcija nije pronađena"));

        if(transaction.getUser().getId()!=userId){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Transakcija nije pronađena");
        }

        transactionRepository.delete(transaction);
    }
}
