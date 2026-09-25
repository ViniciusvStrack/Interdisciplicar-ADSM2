package com.projetointer.backend.payment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PaymentRepository extends JpaRepository<Payment, Long> { List<Payment> findByMemberId(Long memberId); }
