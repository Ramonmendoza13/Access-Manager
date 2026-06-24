package com.accessmanager.config;

import com.accessmanager.model.User;
import com.accessmanager.model.Event;
import com.accessmanager.model.TicketType;
import com.accessmanager.repository.UserRepository;
import com.accessmanager.repository.EventRepository;
import com.accessmanager.repository.TicketTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EventRepository eventRepository;
    private final TicketTypeRepository ticketTypeRepository;

    @Override
    public void run(String... args) {
        // Seed admin user
        if (userRepository.findByEmail("admin@test.com").isEmpty()) {
            User admin = User.builder()
                .email("admin@test.com")
                .password(passwordEncoder.encode("admin"))
                .role("ADMIN")
                .createdAt(LocalDateTime.now())
                .build();
            userRepository.save(admin);
            log.info("Usuario admin creado correctamente");
        } else {
            log.info("Usuario admin ya existe");
        }


    }
}