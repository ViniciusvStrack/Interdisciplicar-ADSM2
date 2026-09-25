package com.projetointer.backend.member;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

@Entity
public class Member {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank private String name;
    @Email @NotBlank @Column(unique = true) private String email;
    @NotBlank private String phone;
    private String belt = "Branca";
    private String plan = "Mensal";
    private LocalDate joinedAt = LocalDate.now();
    private boolean active = true;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getBelt() { return belt; }
    public void setBelt(String belt) { this.belt = belt; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public LocalDate getJoinedAt() { return joinedAt; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
