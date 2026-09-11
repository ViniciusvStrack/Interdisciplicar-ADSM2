package com.projetointer.backend.task;

import javax.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskRepository repository;
    public TaskController(TaskRepository repository) { this.repository = repository; }

    @GetMapping
    public List<Task> list() { return repository.findAll(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Task create(@Valid @RequestBody Task task) { return repository.save(task); }
}
