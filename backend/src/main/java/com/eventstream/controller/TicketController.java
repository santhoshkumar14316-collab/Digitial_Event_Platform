package com.eventstream.controller;

import com.eventstream.dto.TicketBookingRequest;
import com.eventstream.dto.TicketResponse;
import com.eventstream.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class TicketController {

    private final TicketService ticketService;

    @PostMapping("/book")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketResponse> bookTicket(
            @Valid @RequestBody TicketBookingRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ticketService.bookTicket(request.getEventId(), userDetails.getUsername()));
    }

    @GetMapping("/my-tickets")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TicketResponse>> getMyTickets(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ticketService.getUserTickets(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketResponse> getTicketById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ticketService.getTicketById(id, userDetails.getUsername()));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketResponse> cancelTicket(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ticketService.cancelTicket(id, userDetails.getUsername()));
    }

    @GetMapping("/stream-access/{ticketCode}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketResponse> getLiveStreamAccess(
            @PathVariable String ticketCode,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ticketService.getLiveStreamAccess(ticketCode, userDetails.getUsername()));
    }
}
