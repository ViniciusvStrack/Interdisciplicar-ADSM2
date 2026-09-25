package com.projetointer.backend.enrollment;
import java.util.*; import org.springframework.data.jpa.repository.JpaRepository;
public interface EnrollmentRepository extends JpaRepository<Enrollment,Long>{List<Enrollment> findAllByStudentId(Long id);List<Enrollment> findAllByClassOfferingId(Long id);Optional<Enrollment> findByStudentIdAndClassOfferingId(Long studentId,Long classId);long countByClassOfferingIdAndStatusNot(Long id,Enrollment.Status status);}
