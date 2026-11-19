package com.aifinance.backend.controller;

import com.aifinance.backend.dto.CategoryRequest;
import com.aifinance.backend.dto.CategoryResponse;
import com.aifinance.backend.entity.Category;
import com.aifinance.backend.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryService categoryService;
    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<CategoryResponse> getCategories(@AuthenticationPrincipal Jwt jwt){
        Long userId=Long.valueOf(jwt.getSubject());
        return categoryService.getCategoriesForUser(userId).stream().map(category -> new CategoryResponse(category.getId(),category.getName(),category.getType())).toList();
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request,
                                                           @AuthenticationPrincipal Jwt jwt){
        Long userId=Long.valueOf(jwt.getSubject());
        Category category=categoryService.createCategory(request,userId);

        CategoryResponse response= new CategoryResponse(
                category.getId(),category.getName(),category.getType()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
        @PathVariable Long id,
        @Valid @RequestBody CategoryRequest request,
        @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());

        Category category=categoryService.updateCategory(id,request,userId);
        CategoryResponse response= new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getType()
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt
    ){
        Long userId=Long.valueOf(jwt.getSubject());
        categoryService.deleteCategory(id,userId);
        return ResponseEntity.noContent().build();
    }

}
