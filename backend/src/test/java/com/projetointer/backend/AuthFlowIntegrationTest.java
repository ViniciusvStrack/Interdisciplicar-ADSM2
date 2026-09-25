package com.projetointer.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;

@SpringBootTest
@AutoConfigureMockMvc
class AuthFlowIntegrationTest {
    @Autowired MockMvc mvc;

    @Test void registersStudentAndKeepsAuthenticatedSession() throws Exception {
        var result = mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Aluno Teste\",\"email\":\" ALUNO.TESTE@EMAIL.COM \",\"phone\":\"81999990000\",\"password\":\"Senha@123\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.email").value("aluno.teste@email.com"))
            .andExpect(jsonPath("$.role").value("STUDENT"))
            .andReturn();
        mvc.perform(get("/api/auth/me").session((org.springframework.mock.web.MockHttpSession) result.getRequest().getSession(false)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Aluno Teste"));
    }

    @Test void anonymousCannotEnroll() throws Exception {
        mvc.perform(post("/api/student/enrollments").contentType(MediaType.APPLICATION_JSON).content("{\"classOfferingId\":1}"))
            .andExpect(status().isUnauthorized());
    }

    @Test void acceptsFrontendRunningOnIpv4Loopback() throws Exception {
        mvc.perform(options("/api/auth/login")
                .header("Origin", "http://127.0.0.1:5173")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "content-type"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "http://127.0.0.1:5173"))
            .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }
}
