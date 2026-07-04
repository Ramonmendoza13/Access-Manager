package com.accessmanager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "date")
    private LocalDateTime date;

    @Column(name = "venue")
    private String venue;

    @Column(name = "capacity")
    private Integer capacity;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private Boolean active = false;

    @Builder.Default
    @Column(name = "season_pass_enabled", nullable = false, columnDefinition = "boolean default false")
    private Boolean seasonPassEnabled = false;

    @Column(nullable = true)
    private String entradaBackgroundUrl;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TicketType> ticketTypes;
}
