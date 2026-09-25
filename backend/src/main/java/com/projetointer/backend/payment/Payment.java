package com.projetointer.backend.payment;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
public class Payment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @NotNull private Long memberId;
    @NotNull @DecimalMin("0.00") private BigDecimal amount;
    @NotNull private LocalDate dueDate;
    private LocalDate paidAt;
    @Enumerated(EnumType.STRING) private PaymentStatus status = PaymentStatus.PENDING;
    private String description;
    public enum PaymentStatus { PENDING, PAID, OVERDUE, CANCELLED }

    public Long getId() { return id; }
    public Long getMemberId() { return memberId; }
    public void setMemberId(Long memberId) { this.memberId = memberId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public LocalDate getPaidAt() { return paidAt; }
    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; if (status == PaymentStatus.PAID) this.paidAt = LocalDate.now(); }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
