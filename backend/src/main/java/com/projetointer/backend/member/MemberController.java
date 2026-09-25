package com.projetointer.backend.member;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/members")
public class MemberController {
    private final MemberRepository repository;
    public MemberController(MemberRepository repository) { this.repository = repository; }

    @GetMapping public List<Member> list() { return repository.findAll(); }
    @GetMapping("/{id}") public Member find(@PathVariable Long id) { return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado")); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public Member create(@Valid @RequestBody Member member) { return repository.save(member); }
    @PutMapping("/{id}") public Member update(@PathVariable Long id, @Valid @RequestBody Member input) {
        Member member = find(id); member.setName(input.getName()); member.setEmail(input.getEmail()); member.setPhone(input.getPhone()); member.setBelt(input.getBelt()); member.setPlan(input.getPlan()); member.setActive(input.isActive()); return repository.save(member);
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable Long id) { repository.delete(find(id)); }
}
