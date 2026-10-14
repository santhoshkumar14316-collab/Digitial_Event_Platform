package com.eventstream.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TicketBookingRequest {

    @NotNull(message = "Event ID is required")
    private Long eventId;
}
