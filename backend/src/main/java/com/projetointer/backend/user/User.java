package com.projetointer.backend.user;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="users")
public class User {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private String name;
    @Column(nullable=false, unique=true) private String email;
    @Column(nullable=false) private String phone;
    @Column(nullable=false) private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private UserRole role;
    private boolean active=true;
    private LocalDateTime createdAt=LocalDateTime.now();
    protected User() {}
    public User(String name,String email,String phone,String passwordHash,UserRole role){this.name=name;this.email=email;this.phone=phone;this.passwordHash=passwordHash;this.role=role;}
    public Long getId(){return id;} public String getName(){return name;} public String getEmail(){return email;} public String getPhone(){return phone;} public String getPasswordHash(){return passwordHash;} public UserRole getRole(){return role;} public boolean isActive(){return active;}
}
