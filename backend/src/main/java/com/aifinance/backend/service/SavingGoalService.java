package com.aifinance.backend.service;

import com.aifinance.backend.dto.SavingGoalRequest;
import com.aifinance.backend.dto.SavingGoalResponse;
import com.aifinance.backend.entity.SavingGoal;
import com.aifinance.backend.entity.User;
import com.aifinance.backend.repository.SavingGoalRepository;
import com.aifinance.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class SavingGoalService {
    private final SavingGoalRepository savingGoalRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public SavingGoalService(SavingGoalRepository savingGoalRepository, UserRepository userRepository, NotificationService notificationService) {
        this.savingGoalRepository = savingGoalRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }
    @Transactional
    public SavingGoalResponse createSavingGoal(SavingGoalRequest request,Long userId) {
        User user=userRepository.findById(userId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Korisnik nije pronađen"));
        SavingGoal savingGoal=new SavingGoal();

        savingGoal.setUser(user);
        savingGoal.setName(request.name().trim());
        savingGoal.setTargetAmount(request.targetAmount());
        savingGoal.setCurrentAmount(request.currentAmount());
        savingGoal.setTargetDate(request.targetDate());
        savingGoal.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));

        SavingGoal saved=savingGoalRepository.save(savingGoal);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<SavingGoalResponse> getSavingGoalsForUser(Long userId) {
        return  savingGoalRepository
                .findByUser_IdOrderByCreatedAtDescIdDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }
    @Transactional
    public SavingGoalResponse updateSavingGoal(
            Long goalId,
            SavingGoalRequest request,
            Long userId
    ){
        SavingGoal savingGoal=savingGoalRepository.findByIdForUpdate(goalId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Cilj štednje nije pronađen"));
        if(savingGoal.getUser().getId()!=userId){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Cilj štednje nije pronađen");
        }

        boolean wasCompleted=savingGoal.getCurrentAmount().compareTo(savingGoal.getTargetAmount())>=0;

        savingGoal.setName(request.name().trim());
        savingGoal.setTargetAmount(request.targetAmount());
        savingGoal.setCurrentAmount(request.currentAmount());
        savingGoal.setTargetDate(request.targetDate());

        SavingGoal saved=savingGoalRepository.save(savingGoal);
        boolean isCompleted=saved.getCurrentAmount().compareTo(saved.getTargetAmount())>=0;

        if(!wasCompleted && isCompleted){
            String message=
                    "Uspješno si ostvario cilj štednje \""
                    + saved.getName()
                    + "\" i dostigao planirani iznos od "
                    + saved.getCurrentAmount()
                    + " KM.";
            notificationService.createNotification(
                    saved.getUser(),
                    "Cilj štednje ostvaren",
                    message,
                    "SAVING_GOAL"
            );
        }

        return toResponse(saved);
    }
    @Transactional
    public void deleteSavingGoal(Long goalId, Long userId) {
        SavingGoal savingGoal=savingGoalRepository.findById(goalId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Cilj štednje nije pronađen"));
        if(savingGoal.getUser().getId()!=userId){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Cilj štednje nije pronađen");
        }
        savingGoalRepository.delete(savingGoal);
    }

    private SavingGoalResponse toResponse(SavingGoal savingGoal) {
        BigDecimal remainingAmount=savingGoal.getTargetAmount()
                .subtract(savingGoal.getCurrentAmount())
                .max(BigDecimal.ZERO);

        BigDecimal progressPercentage=savingGoal.getCurrentAmount()
                .multiply(BigDecimal.valueOf(100))
                .divide(
                        savingGoal.getTargetAmount(),
                        2,
                        RoundingMode.HALF_UP
                );

        return new SavingGoalResponse(
                savingGoal.getId(),
                savingGoal.getName(),
                savingGoal.getTargetAmount(),
                savingGoal.getCurrentAmount(),
                remainingAmount,
                progressPercentage,
                savingGoal.getTargetDate(),
                savingGoal.getCreatedAt()
        );
    }
}
