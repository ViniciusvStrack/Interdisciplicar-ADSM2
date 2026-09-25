package com.projetointer.backend.event;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
public class EventRegistration {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @NotNull private Long eventId;
    @NotNull private Long memberId;
    @Enumerated(EnumType.STRING) private RegistrationStatus status = RegistrationStatus.PENDING_PAYMENT;
    private LocalDateTime registeredAt = LocalDateTime.now();
    public enum RegistrationStatus { PENDING_PAYMENT, CONFIRMED, CANCELLED }

    public Long getId() { return id; }
    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }
    public Long getMemberId() { return memberId; }
    public void setMemberId(Long memberId) { this.memberId = memberId; }
    public RegistrationStatus getStatus() { return status; }
    public void setStatus(RegistrationStatus status) { this.status = status; }
    public LocalDateTime getRegisteredAt() { return registeredAt; }
}
