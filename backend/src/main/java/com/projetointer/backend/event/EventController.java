package com.projetointer.backend.event;

import com.projetointer.backend.member.ResourceNotFoundException;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private final EventRepository events;
    private final EventRegistrationRepository registrations;
    public EventController(EventRepository events, EventRegistrationRepository registrations) { this.events = events; this.registrations = registrations; }

    @GetMapping public List<AcademyEvent> list() { return events.findAll(); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public AcademyEvent create(@Valid @RequestBody AcademyEvent event) { return events.save(event); }
    @GetMapping("/{id}/registrations") public List<EventRegistration> registrations(@PathVariable Long id) { return registrations.findByEventId(id); }
    @PostMapping("/{id}/registrations") @ResponseStatus(HttpStatus.CREATED) public EventRegistration register(@PathVariable Long id, @Valid @RequestBody EventRegistration registration) { if (!events.existsById(id)) throw new ResourceNotFoundException("Aulão não encontrado"); registration.setEventId(id); return registrations.save(registration); }
    @PatchMapping("/registrations/{id}/status") public EventRegistration status(@PathVariable Long id, @RequestParam EventRegistration.RegistrationStatus value) { EventRegistration item = registrations.findById(id).orElseThrow(() -> new ResourceNotFoundException("Inscrição não encontrada")); item.setStatus(value); return registrations.save(item); }
}
