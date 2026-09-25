package com.projetointer.backend.bootstrap;
import com.projetointer.backend.catalog.*; import com.projetointer.backend.user.*; import java.math.BigDecimal; import org.springframework.boot.CommandLineRunner; import org.springframework.security.crypto.password.PasswordEncoder; import org.springframework.stereotype.Component;
@Component public class SpiritHardDataInitializer implements CommandLineRunner{
 private final UserRepository users;private final ClassOfferingRepository classes;private final PasswordEncoder encoder;
 public SpiritHardDataInitializer(UserRepository u,ClassOfferingRepository c,PasswordEncoder e){users=u;classes=c;encoder=e;}
 public void run(String...a){var ar=user("A. Ribeiro","aribeiro@spirithard.com","Professor@123",UserRole.TEACHER);var vd=user("Vinícius Dantas","vinicius.dantas@spirithard.com","Professor@123",UserRole.TEACHER);var jp=user("João Paulo","joao.paulo@spirithard.com","Professor@123",UserRole.TEACHER);user("Aluno Demonstração","aluno@spirithard.com","Aluno@123",UserRole.STUDENT);
  cls("muay-thai","Muay Thai","Muay Thai","Segunda, quarta e sexta","19:00–20:00","A. Ribeiro",80,ar,true,null);
  cls("boxe","Boxe","Boxe","Segunda, quarta e sexta","18:00–19:00","Vinícius Dantas",80,vd,true,null);
  cls("boxe-noite","Boxe Noturno","Boxe","Segunda, quarta e sexta","20:00–21:00","João Paulo",80,jp,true,null);
  cls("jj-adulto-manha","Jiu-jítsu Adulto","Jiu-jítsu","Segunda, quarta e sexta","08:30–10:00","Marcinho",100,null,true,null);
  cls("jj-adulto-tarde","Jiu-jítsu Adulto","Jiu-jítsu","Terça e quinta","17:00–18:30","Naninha",100,null,true,null);
  cls("jj-adulto-noite-1","Jiu-jítsu Adulto","Jiu-jítsu","Segunda, quarta e sexta","19:00–20:30","Marcinho",100,null,true,null);
  cls("jj-adulto-noite-2","Jiu-jítsu Adulto","Jiu-jítsu","Segunda, quarta e sexta","20:30–22:00","Marcinho",100,null,true,null);
  cls("jj-kids-1","Jiu-jítsu Kids","Jiu-jítsu Kids","Segunda, quarta e sexta","18:00–19:00","Naninha",90,null,false,"Temporariamente sem vagas");
  cls("jj-kids-2","Jiu-jítsu Kids 10+","Jiu-jítsu Kids","Segunda, quarta e sexta","19:00–20:00","Naninha",90,null,true,"A partir de 10 anos");
  cls("jj-kids-3","Jiu-jítsu Kids","Jiu-jítsu Kids","Terça e quinta","16:00–17:00","Naninha",80,null,true,null);
 }
 private User user(String n,String e,String p,UserRole r){return users.findByEmailIgnoreCase(e).orElseGet(()->users.save(new User(n,e,"(81) 99999-0000",encoder.encode(p),r)));}
 private void cls(String s,String n,String m,String d,String t,String i,int p,User u,boolean av,String note){if(classes.findBySlug(s).isEmpty())classes.save(new ClassOffering(s,n,m,d,t,i,BigDecimal.valueOf(p),u,av,note));}
}
