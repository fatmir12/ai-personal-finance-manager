package com.aifinance.backend.service;

import com.aifinance.backend.dto.RecurringTransactionRequest;
import com.aifinance.backend.dto.RecurringTransactionResponse;
import com.aifinance.backend.entity.Account;
import com.aifinance.backend.entity.Category;
import com.aifinance.backend.entity.RecurringTransaction;
import com.aifinance.backend.entity.User;
import com.aifinance.backend.repository.AccountRepository;
import com.aifinance.backend.repository.CategoryRepository;
import com.aifinance.backend.repository.RecurringTransactionRepository;
import com.aifinance.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class RecurringTransactionService {
    private final RecurringTransactionRepository recurringTransactionRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;

    public RecurringTransactionService(RecurringTransactionRepository transactionRepository, CategoryRepository categoryRepository, UserRepository userRepository, AccountRepository accountRepository) {
        this.recurringTransactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional
    public RecurringTransactionResponse createReccuringTransaction(
            RecurringTransactionRequest request,
            Long userId
    ){
        User user=userRepository.findById(userId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Korisnik nije pronađen"));
        Category category=categoryRepository
                .findById(request.categoryId())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Kategorija nije pronađena"));
        if(category.getUser()!=null && category.getUser().getId()!=userId){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Kategorija nije pronađena");
        }
        Account account=accountRepository.findById(request.accountId())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Račun nije pronađen"));
        if(account.getUser().getId()!=userId){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Račun nije pronađen");
        }

        RecurringTransaction recurringTransaction =new RecurringTransaction();

        recurringTransaction.setUser(user);
        recurringTransaction.setCategory(category);
        recurringTransaction.setAccount(account);
        recurringTransaction.setAmount(request.amount());
        recurringTransaction.setDescription(request.description());
        recurringTransaction.setFrequency(request.frequency());
        recurringTransaction.setNextRunDate(request.nextRunDate());
        recurringTransaction.setActive(request.active());
        recurringTransaction.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));

        RecurringTransaction saved= recurringTransactionRepository.save(recurringTransaction);

        return toResponse(saved);
    }
    @Transactional(readOnly = true)
    public List<RecurringTransactionResponse> getRecurringTransactionsForUser(Long userId){
        return recurringTransactionRepository
                .findByUser_IdOrderByCreatedAtDescIdDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }
    @Transactional
    public RecurringTransactionResponse updateReccuringTransaction(
            Long recurringId,
            RecurringTransactionRequest request,
            Long userId
    ){
        RecurringTransaction recurringTransaction=recurringTransactionRepository.findById(recurringId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Ponavljajuća transakcija nije pronađena"));
        if(recurringTransaction.getUser().getId()!=userId){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Ponavljajuća transakcija nije pronađena");
        }
        Category category=categoryRepository
                .findById(request.categoryId())
                .orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND,"Kategorija nije pronađena"));
        if(category.getUser()!=null && category.getUser().getId()!=userId){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Kategorija nije pronađena");
        }

        Account account=accountRepository
                .findById(request.accountId())
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Račun nije pronađen"));
        if(account.getUser().getId()!=userId){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Račun nije pronađen");
        }

        recurringTransaction.setCategory(category);
        recurringTransaction.setAccount(account);
        recurringTransaction.setAmount(request.amount());
        recurringTransaction.setDescription(request.description());
        recurringTransaction.setFrequency(request.frequency());
        recurringTransaction.setNextRunDate(request.nextRunDate());
        recurringTransaction.setActive(request.active());

        RecurringTransaction saved= recurringTransactionRepository.save(recurringTransaction);
        return toResponse(saved);
    }
    public void deleteRecurringTransaction(Long recurringId,Long userId){
        RecurringTransaction recurringTransaction=recurringTransactionRepository.findById(recurringId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Ponavljajuća transakcija nije pronađena"));
        if(recurringTransaction.getUser().getId()!=userId){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Ponavljajuća transakcija nije pronađena");
        }
        recurringTransactionRepository.delete(recurringTransaction);
    }

    private RecurringTransactionResponse toResponse(RecurringTransaction recurringTransaction){
        return new RecurringTransactionResponse(
                recurringTransaction.getId(),
                recurringTransaction.getCategory().getId(),
                recurringTransaction.getCategory().getName(),
                recurringTransaction.getCategory().getType(),
                recurringTransaction.getAccount().getId(),
                recurringTransaction.getAccount().getName(),
                recurringTransaction.getAmount(),
                recurringTransaction.getDescription(),
                recurringTransaction.getFrequency(),
                recurringTransaction.getNextRunDate(),
                recurringTransaction.isActive(),
                recurringTransaction.getCreatedAt()
        );
    }
}
