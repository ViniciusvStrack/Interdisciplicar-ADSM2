package com.projetointer.backend.event;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {
    List<EventRegistration> findByEventId(Long eventId);
    List<EventRegistration> findByMemberId(Long memberId);
}
