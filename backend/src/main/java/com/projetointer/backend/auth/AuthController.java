package com.projetointer.backend.auth;

import com.projetointer.backend.user.*;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.Locale;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController @RequestMapping("/api/auth")
public class AuthController {
 record Register(@NotBlank String name,@Email @NotBlank String email,@NotBlank String phone,@Size(min=8) String password){Register{name=name==null?null:name.trim();email=email==null?null:email.trim();phone=phone==null?null:phone.trim();}}
 record Login(@Email @NotBlank String email,@NotBlank String password){Login{email=email==null?null:email.trim();}}
 public record UserView(Long id,String name,String email,String phone,UserRole role){}
 private final UserRepository users; private final PasswordEncoder encoder; private final AuthenticationManager manager;
 public AuthController(UserRepository u,PasswordEncoder e,AuthenticationManager m){users=u;encoder=e;manager=m;}
 @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED) UserView register(@Valid @RequestBody Register r,HttpServletRequest req){String email=norm(r.email());if(users.findByEmailIgnoreCase(email).isPresent())throw new ResponseStatusException(HttpStatus.CONFLICT,"E-mail já cadastrado");var u=users.save(new User(r.name().trim(),email,r.phone().trim(),encoder.encode(r.password()),UserRole.STUDENT));authenticate(email,r.password(),req);return view(u);}
 @PostMapping("/login") UserView login(@Valid @RequestBody Login r,HttpServletRequest req){authenticate(norm(r.email()),r.password(),req);return view(users.findByEmailIgnoreCase(norm(r.email())).orElseThrow());}
 @GetMapping("/me") UserView me(Authentication a){return view(users.findByEmailIgnoreCase(a.getName()).orElseThrow());}
 @PostMapping("/logout") @ResponseStatus(HttpStatus.NO_CONTENT) void logout(HttpServletRequest req){var s=req.getSession(false);if(s!=null)s.invalidate();SecurityContextHolder.clearContext();}
 private void authenticate(String email,String pass,HttpServletRequest req){var auth=manager.authenticate(new UsernamePasswordAuthenticationToken(email,pass));var context=SecurityContextHolder.createEmptyContext();context.setAuthentication(auth);SecurityContextHolder.setContext(context);req.getSession(true).setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,context);}
 private static String norm(String e){return e.trim().toLowerCase(Locale.ROOT);} private static UserView view(User u){return new UserView(u.getId(),u.getName(),u.getEmail(),u.getPhone(),u.getRole());}
}
