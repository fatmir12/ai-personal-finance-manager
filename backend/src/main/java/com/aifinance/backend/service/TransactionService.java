
package com.aifinance.backend.service;

import com.aifinance.backend.dto.TransactionRequest;
import com.aifinance.backend.dto.TransactionResponse;
import com.aifinance.backend.entity.Account;
import com.aifinance.backend.entity.Category;
import com.aifinance.backend.entity.Transaction;
import com.aifinance.backend.entity.User;
import com.aifinance.backend.repository.AccountRepository;
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
    private final AccountRepository accountRepository;

    public TransactionService(
            TransactionRepository transactionRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository,
            AccountRepository accountRepository
    ) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional
    public TransactionResponse createTransaction(
            TransactionRequest request,
            Long userId
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Korisnik nije pronađen"
                ));

        Category category = findAllowedCategory(request.categoryId(), userId);

        Account account = findOwnedAccount(request.accountId(), userId);

        Transaction transaction = new Transaction();

        transaction.setUser(user);
        transaction.setCategory(category);
        transaction.setAccount(account);
        transaction.setAmount(request.amount());
        transaction.setDescription(request.description());
        transaction.setTransactionDate(request.transactionDate());
        transaction.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));

        Transaction saved = transactionRepository.save(transaction);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactionsForUser(Long userId) {

        return transactionRepository
                .findByUser_IdOrderByTransactionDateDescIdDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TransactionResponse updateTransaction(
            Long transactionId,
            TransactionRequest request,
            Long userId
    ) {
        Transaction transaction = transactionRepository
                .findById(transactionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Transakcija nije pronađena"
                ));

        if (transaction.getUser().getId() != userId) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Transakcija nije pronađena"
            );
        }

        Category category = findAllowedCategory(request.categoryId(), userId);
        Account account = findOwnedAccount(request.accountId(), userId);

        transaction.setCategory(category);
        transaction.setAccount(account);
        transaction.setAmount(request.amount());
        transaction.setDescription(request.description());
        transaction.setTransactionDate(request.transactionDate());

        Transaction saved = transactionRepository.save(transaction);

        return toResponse(saved);
    }

    @Transactional
    public void deleteTransaction(Long transactionId, Long userId) {

        Transaction transaction = transactionRepository
                .findById(transactionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Transakcija nije pronađena"
                ));

        if (transaction.getUser().getId() != userId) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Transakcija nije pronađena"
            );
        }

        transactionRepository.delete(transaction);
    }

    private Category findAllowedCategory(Long categoryId, Long userId) {

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Kategorija nije pronađena"
                ));

        if (category.getUser() != null &&
                category.getUser().getId() != userId) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Kategorija nije pronađena"
            );
        }

        return category;
    }

    private Account findOwnedAccount(Long accountId, Long userId) {

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Finansijski račun nije pronađen"
                ));

        if (account.getUser().getId() != userId) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Finansijski račun nije pronađen"
            );
        }

        return account;
    }

    private TransactionResponse toResponse(Transaction transaction) {

        Account account = transaction.getAccount();

        return new TransactionResponse(
                transaction.getId(),
                transaction.getCategory().getId(),
                transaction.getCategory().getName(),
                transaction.getCategory().getType(),
                account != null ? account.getId() : null,
                account != null ? account.getName() : null,
                transaction.getAmount(),
                transaction.getDescription(),
                transaction.getTransactionDate(),
                transaction.getCreatedAt()
        );
    }
}
