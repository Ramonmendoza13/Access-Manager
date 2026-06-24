package com.accessmanager.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "abonados")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Abonado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private Integer numero;

    @Column(nullable = false)
    private String holderName;

    @Column(nullable = false)
    private String holderEmail;

    @Column(unique = true, nullable = false)
    private String qrCode;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "abono_type_id", nullable = false)
    private AbonoType abonoType;
}
