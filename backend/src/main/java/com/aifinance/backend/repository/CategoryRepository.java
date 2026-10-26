package com.aifinance.backend.repository;

import com.aifinance.backend.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category,Long> {
    List<Category> findByUserIsNull();
    List<Category> findByUserIsNullOrUser_Id(Long userId);
    boolean existsByNameIgnoreCaseAndTypeAndUser_Id(
            String name,
            String type,
            Long userId
    );
    boolean existsByNameIgnoreCaseAndTypeAndUser_IdAndIdNot(
            String name,
            String type,
            Long userId,
            Long categoryId
    );
}
