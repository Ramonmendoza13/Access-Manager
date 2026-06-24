package com.accessmanager.dto.response;

public record AccessStatsResponse(
        long totalTickets,
        long scanned,
        long remaining,
        long seasonPassesScannedToday
) {
}
