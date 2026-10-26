package com.aifinance.backend.service;

import com.aifinance.backend.dto.CategoryRequest;
import com.aifinance.backend.entity.Category;
import com.aifinance.backend.entity.User;
import com.aifinance.backend.repository.CategoryRepository;
import com.aifinance.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public CategoryService(CategoryRepository categoryRepository, UserRepository userRepository) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    public List<Category> getSystemCategories() {
        return categoryRepository.findByUserIsNull();
    }

    public List<Category> getCategoriesForUser(Long userId){
        return categoryRepository.findByUserIsNullOrUser_Id(userId);
    }

    public Category createCategory(CategoryRequest request, Long userId) {
        User user= userRepository.findById(userId).orElseThrow(()->new IllegalArgumentException("Korisnik nije pronađen"));

        String name=request.name().trim();

        boolean alreadyExist = categoryRepository.existsByNameIgnoreCaseAndTypeAndUser_Id(name,request.type(),userId);
        boolean systemCategoryExist=categoryRepository.findByUserIsNull().stream().anyMatch(category -> category.getName().equalsIgnoreCase(name) && category.getType().equals(request.type()));

        if(alreadyExist || systemCategoryExist){
            throw new IllegalArgumentException(
                    "Kategorija s ovim nazivom i tipom već postoji"
            );
        }

        Category category = new Category();
        category.setName(name);
        category.setType(request.type());
        category.setUser(user);

        return categoryRepository.save(category);
    }

    public Category updateCategory(
            Long categoryId,
            CategoryRequest request,
            Long userId
    ){
        Category category= categoryRepository.findById(categoryId)
                .orElseThrow(()-> new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND,"Kategorija nije pronađena"
                ));

        if(category.getUser()==null || category.getUser().getId()!=userId){
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND,"Kategorija ne postoji");
        }

        String name=request.name().trim();

        boolean duplicateOwn=categoryRepository
                .existsByNameIgnoreCaseAndTypeAndUser_IdAndIdNot(name,request.type(),userId,categoryId);

        boolean duplicateSystem=categoryRepository.findByUserIsNull()
                .stream()
                .anyMatch(c->c.getName().equalsIgnoreCase(name)&&c.getType().equals(request.type()));

        boolean unchanged = category.getName().equalsIgnoreCase(name)&&category.getType().equals(request.type());

        if(duplicateOwn || duplicateSystem){
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.CONFLICT,"Kategorija s ovim nazivom i tipom već postoji");
        }
        category.setName(name);
        category.setType(request.type());
        return categoryRepository.save(category);
    }

    public void deleteCategory(
            Long categoryId,
            Long userId
    ){
        Category category=categoryRepository.findById(categoryId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Kategorija nije pronađena"
        ));

        if(category.getUser()==null || category.getUser().getId()!=userId){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Kategorija nije pronađena");
        }
        categoryRepository.delete(category);
    }
}
