package com.projetointer.backend.catalog;
import java.util.*; import org.springframework.data.jpa.repository.JpaRepository;
public interface ClassOfferingRepository extends JpaRepository<ClassOffering,Long>{Optional<ClassOffering> findBySlug(String slug);List<ClassOffering> findAllByActiveTrueOrderByIdAsc();List<ClassOffering> findAllByTeacherIdAndActiveTrue(Long id);}
