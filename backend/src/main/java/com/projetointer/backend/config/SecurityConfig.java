package com.projetointer.backend.config;

import com.projetointer.backend.user.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import org.springframework.context.annotation.*;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;

@Configuration @EnableMethodSecurity
public class SecurityConfig {
 @Bean PasswordEncoder passwordEncoder(){return new BCryptPasswordEncoder();}
 @Bean UserDetailsService users(UserRepository repo){return email->{var u=repo.findByEmailIgnoreCase(email.trim()).orElseThrow(()->new UsernameNotFoundException("Credenciais inválidas"));return User.withUsername(u.getEmail()).password(u.getPasswordHash()).roles(u.getRole().name()).disabled(!u.isActive()).build();};}
 @Bean AuthenticationManager authenticationManager(AuthenticationConfiguration c)throws Exception{return c.getAuthenticationManager();}
 @Bean SecurityFilterChain security(HttpSecurity http)throws Exception{return http.csrf(c->c.disable()).cors(c->{}).authorizeHttpRequests(a->a.requestMatchers("/api/auth/login","/api/auth/register","/api/catalog/**","/error").permitAll().requestMatchers("/api/members/**","/api/payments/**","/api/events/**","/api/tasks/**").hasRole("TEACHER").anyRequest().authenticated()).exceptionHandling(e->e.authenticationEntryPoint((q,r,x)->r.sendError(HttpServletResponse.SC_UNAUTHORIZED)).accessDeniedHandler((q,r,x)->r.sendError(HttpServletResponse.SC_FORBIDDEN))).build();}
 @Bean CorsConfigurationSource corsConfigurationSource(){var c=new CorsConfiguration();c.setAllowedOrigins(List.of("http://localhost:5173","http://127.0.0.1:5173"));c.setAllowedMethods(List.of("GET","POST","DELETE","PUT","PATCH","OPTIONS"));c.setAllowedHeaders(List.of("*"));c.setAllowCredentials(true);var s=new UrlBasedCorsConfigurationSource();s.registerCorsConfiguration("/**",c);return s;}
}
