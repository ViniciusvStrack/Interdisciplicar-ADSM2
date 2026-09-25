package com.projetointer.backend.payment;

import com.projetointer.backend.member.ResourceNotFoundException;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentRepository repository;
    public PaymentController(PaymentRepository repository) { this.repository = repository; }
    @GetMapping public List<Payment> list(@RequestParam(required = false) Long memberId) { return memberId == null ? repository.findAll() : repository.findByMemberId(memberId); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public Payment create(@Valid @RequestBody Payment payment) { return repository.save(payment); }
    @PatchMapping("/{id}/status") public Payment status(@PathVariable Long id, @RequestParam Payment.PaymentStatus value) { Payment payment = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Pagamento não encontrado")); payment.setStatus(value); return repository.save(payment); }
}
