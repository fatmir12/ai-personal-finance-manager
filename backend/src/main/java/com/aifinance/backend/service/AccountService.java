package com.aifinance.backend.service;

import com.aifinance.backend.dto.AccountRequest;
import com.aifinance.backend.dto.AccountResponse;
import com.aifinance.backend.entity.Account;
import com.aifinance.backend.entity.User;
import com.aifinance.backend.repository.AccountRepository;
import com.aifinance.backend.repository.TransactionRepository;
import com.aifinance.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class AccountService {
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    public AccountService(AccountRepository accountRepository, UserRepository userRepository, TransactionRepository transactionRepository) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public AccountResponse createAccount(AccountRequest request, Long userId) {
        User user=userRepository.findById(userId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND, "Korisnik nije pronađen"));
        Account account=new Account();
        account.setUser(user);
        account.setName(request.name().trim());
        account.setType(request.type());
        account.setInitialBalance(request.initialBalance());
        account.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));

        Account savedAccount=accountRepository.save(account);

        return new AccountResponse(
                savedAccount.getId(),
                savedAccount.getName(),
                savedAccount.getType(),
                savedAccount.getInitialBalance(),
                calculateCurrentBalance(savedAccount,userId),
                savedAccount.getCreatedAt()
        );
    }
    @Transactional(readOnly = true)
    public List<AccountResponse> getAccountForUser(Long userId) {
        return accountRepository
                .findByUser_IdOrderByIdAsc(userId)
                .stream()
                .map(account -> new AccountResponse(
                        account.getId(),
                        account.getName(),
                        account.getType(),
                        account.getInitialBalance(),
                        calculateCurrentBalance(account,userId),
                        account.getCreatedAt()
                )).toList();
    }
    @Transactional
    public AccountResponse updateAccount(Long accountId, AccountRequest request, Long userId) {
        Account account=accountRepository.findById(accountId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Račun nije pronađen"));
        if(account.getUser().getId() != userId){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Račun nije pronađen");
        }
    account.setName(request.name().trim());
        account.setType(request.type());
        account.setInitialBalance(request.initialBalance());

        Account savedAccount=accountRepository.save(account);
        return new AccountResponse(
                savedAccount.getId(),
                savedAccount.getName(),
                savedAccount.getType(),
                savedAccount.getInitialBalance(),
                calculateCurrentBalance(savedAccount,userId),
                savedAccount.getCreatedAt()
        );
    }
    @Transactional
    public void deleteAccount(Long accountId, Long userId) {
        Account account=accountRepository.findById(accountId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Račun nije pronađen"));
        if(account.getUser().getId() != userId){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Račun nije pronađen");
        }
        if(transactionRepository.existsByAccount_Id(accountId)){
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Račun se ne može obrisati jer ima povezane transakcije");
        }
        accountRepository.delete(account);
    }

    private BigDecimal calculateCurrentBalance(Account account, Long userId) {
        BigDecimal income=transactionRepository
                .sumIncomeByAccount(account.getId(),userId);

        BigDecimal expense=transactionRepository
                .sumExpenseByAccount(account.getId(),userId);

        if(income==null){
            income=BigDecimal.ZERO;
        }
        if(expense==null){
            expense=BigDecimal.ZERO;
        }

        return account.getInitialBalance()
                .add(income)
                .subtract(expense);
    }
}
