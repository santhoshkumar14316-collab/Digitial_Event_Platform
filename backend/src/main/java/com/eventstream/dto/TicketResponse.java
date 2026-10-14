package com.eventstream.dto;

import com.eventstream.entity.Ticket;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TicketResponse {

    private Long id;
    private String ticketCode;
    private Long eventId;
    private String eventTitle;
    private LocalDateTime eventDate;
    private BigDecimal ticketPrice;
    private String streamUrl;
    private Long userId;
    private String userName;
    private LocalDateTime purchaseDate;
    private String status;

    public static TicketResponse fromEntity(Ticket ticket, boolean includeStreamUrl) {
        return TicketResponse.builder()
                .id(ticket.getId())
                .ticketCode(ticket.getTicketCode())
                .eventId(ticket.getEvent() != null ? ticket.getEvent().getId() : null)
                .eventTitle(ticket.getEvent() != null ? ticket.getEvent().getTitle() : null)
                .eventDate(ticket.getEvent() != null ? ticket.getEvent().getEventDate() : null)
                .ticketPrice(ticket.getEvent() != null ? ticket.getEvent().getTicketPrice() : null)
                .streamUrl(includeStreamUrl && ticket.getEvent() != null ? ticket.getEvent().getStreamUrl() : null)
                .userId(ticket.getUser() != null ? ticket.getUser().getId() : null)
                .userName(ticket.getUser() != null ? ticket.getUser().getName() : null)
                .purchaseDate(ticket.getPurchaseDate())
                .status(ticket.getStatus())
                .build();
    }
}
