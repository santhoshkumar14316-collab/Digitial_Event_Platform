package com.eventstream.service;

import com.eventstream.dto.TicketResponse;
import com.eventstream.entity.Event;
import com.eventstream.entity.Payment;
import com.eventstream.entity.Ticket;
import com.eventstream.entity.User;
import com.eventstream.repository.EventRepository;
import com.eventstream.repository.PaymentRepository;
import com.eventstream.repository.TicketRepository;
import com.eventstream.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    @Transactional
    public TicketResponse bookTicket(Long eventId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + eventId));

        if (event.getAvailableSeats() <= 0) {
            throw new RuntimeException("No available seats left for this event!");
        }

        // Check if user already has an active booked ticket for this event
        List<Ticket> existingTickets = ticketRepository.findByUser(user);
        boolean alreadyBooked = existingTickets.stream()
                .anyMatch(t -> t.getEvent().getId().equals(eventId) && "BOOKED".equalsIgnoreCase(t.getStatus()));

        if (alreadyBooked) {
            throw new RuntimeException("You already have an active ticket for this event!");
        }

        // Generate unique 8-character code
        String ticketCode = "TKT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Decrement available seats
        event.setAvailableSeats(event.getAvailableSeats() - 1);
        eventRepository.save(event);

        // Save Ticket
        Ticket ticket = Ticket.builder()
                .ticketCode(ticketCode)
                .user(user)
                .event(event)
                .status("BOOKED")
                .build();

        Ticket savedTicket = ticketRepository.save(ticket);

        // Create Payment record
        Payment payment = Payment.builder()
                .ticket(savedTicket)
                .amount(event.getTicketPrice())
                .paymentStatus("COMPLETED")
                .build();
        paymentRepository.save(payment);

        return TicketResponse.fromEntity(savedTicket, false);
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getUserTickets(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        return ticketRepository.findByUser(user).stream()
                .map(t -> TicketResponse.fromEntity(t, false))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicketById(Long ticketId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));

        boolean isOwner = ticket.getUser().getId().equals(user.getId());
        boolean isAdmin = "ROLE_ADMIN".equalsIgnoreCase(user.getRole());

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("Unauthorized to view this ticket");
        }

        return TicketResponse.fromEntity(ticket, false);
    }

    @Transactional
    public TicketResponse cancelTicket(Long ticketId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));

        boolean isOwner = ticket.getUser().getId().equals(user.getId());
        boolean isAdmin = "ROLE_ADMIN".equalsIgnoreCase(user.getRole());

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("Unauthorized to cancel this ticket");
        }

        if ("CANCELLED".equalsIgnoreCase(ticket.getStatus())) {
            throw new RuntimeException("Ticket is already cancelled");
        }

        // Update status to CANCELLED
        ticket.setStatus("CANCELLED");
        Ticket updatedTicket = ticketRepository.save(ticket);

        // Increment available seats back
        Event event = ticket.getEvent();
        event.setAvailableSeats(event.getAvailableSeats() + 1);
        eventRepository.save(event);

        // Update Payment status
        paymentRepository.findByTicketId(ticket.getId()).ifPresent(p -> {
            p.setPaymentStatus("REFUNDED");
            paymentRepository.save(p);
        });

        return TicketResponse.fromEntity(updatedTicket, false);
    }

    @Transactional(readOnly = true)
    public TicketResponse getLiveStreamAccess(String ticketCode, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        Ticket ticket = ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new RuntimeException("Invalid ticket code: " + ticketCode));

        boolean isOwner = ticket.getUser().getId().equals(user.getId());
        boolean isAdmin = "ROLE_ADMIN".equalsIgnoreCase(user.getRole());
        boolean isOrganizer = ticket.getEvent().getOrganizer().getId().equals(user.getId());

        if (!isOwner && !isAdmin && !isOrganizer) {
            throw new RuntimeException("Unauthorized: Ticket does not belong to you!");
        }

        if (!"BOOKED".equalsIgnoreCase(ticket.getStatus())) {
            throw new RuntimeException("Ticket status is invalid or cancelled!");
        }

        // Return ticket response WITH stream URL authorized
        return TicketResponse.fromEntity(ticket, true);
    }
}
