package com.projetointer.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest @AutoConfigureMockMvc
class SpiritHardFlowIntegrationTest {
 @Autowired MockMvc mvc;
 private MockHttpSession login(String email,String password)throws Exception{return (MockHttpSession)mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\""+email+"\",\"password\":\""+password+"\"}" )).andExpect(status().isOk()).andReturn().getRequest().getSession(false);}
 @Test void studentEnrollmentAppearsForAssignedTeacher()throws Exception{
  mvc.perform(get("/api/catalog/classes")).andExpect(status().isOk()).andExpect(jsonPath("$[0].name").exists());
  var student=login("aluno@spirithard.com","Aluno@123");
  mvc.perform(post("/api/student/enrollments").session(student).contentType(MediaType.APPLICATION_JSON).content("{\"classOfferingId\":1}" )).andExpect(status().isCreated());
  mvc.perform(get("/api/student/dashboard").session(student)).andExpect(status().isOk()).andExpect(jsonPath("$.enrollments[0].className").exists());
  var teacher=login("aribeiro@spirithard.com","Professor@123");
  mvc.perform(get("/api/teacher/dashboard").session(teacher)).andExpect(status().isOk()).andExpect(jsonPath("$.classes[0].students[0].email").value("aluno@spirithard.com"));
 }

 @Test void studentCannotAccessLegacyAdministrativeApis()throws Exception{
  var student=login("aluno@spirithard.com","Aluno@123");
  mvc.perform(get("/api/members").session(student)).andExpect(status().isForbidden());
  mvc.perform(get("/api/payments").session(student)).andExpect(status().isForbidden());
  mvc.perform(get("/api/events").session(student)).andExpect(status().isForbidden());
  mvc.perform(get("/api/tasks").session(student)).andExpect(status().isForbidden());
 }

 @Test void enrollmentRequiresClassOfferingId()throws Exception{
  var student=login("aluno@spirithard.com","Aluno@123");
  mvc.perform(post("/api/student/enrollments").session(student)
    .contentType(MediaType.APPLICATION_JSON).content("{}"))
    .andExpect(status().isBadRequest());
 }
}
