package com.eventstream.service;

import com.eventstream.dto.EventRequest;
import com.eventstream.dto.EventResponse;
import com.eventstream.entity.Event;
import com.eventstream.entity.User;
import com.eventstream.repository.EventRepository;
import com.eventstream.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll().stream()
                .map(EventResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EventResponse getEventById(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));
        return EventResponse.fromEntity(event);
    }

    @Transactional
    public EventResponse createEvent(EventRequest request, String organizerEmail) {
        User organizer = userRepository.findByEmail(organizerEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + organizerEmail));

        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .eventDate(request.getEventDate())
                .ticketPrice(request.getTicketPrice())
                .totalSeats(request.getTotalSeats())
                .availableSeats(request.getTotalSeats()) // Initial available seats equals total seats
                .streamUrl(request.getStreamUrl())
                .organizer(organizer)
                .build();

        Event savedEvent = eventRepository.save(event);
        return EventResponse.fromEntity(savedEvent);
    }

    @Transactional
    public EventResponse updateEvent(Long id, EventRequest request, String userEmail) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        boolean isOrganizer = event.getOrganizer().getId().equals(user.getId());
        boolean isAdmin = "ROLE_ADMIN".equalsIgnoreCase(user.getRole());

        if (!isOrganizer && !isAdmin) {
            throw new RuntimeException("Unauthorized to edit this event");
        }

        int seatDifference = request.getTotalSeats() - event.getTotalSeats();
        int newAvailableSeats = event.getAvailableSeats() + seatDifference;
        if (newAvailableSeats < 0) {
            throw new RuntimeException("Cannot reduce total seats below already booked tickets count");
        }

        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setEventDate(request.getEventDate());
        event.setTicketPrice(request.getTicketPrice());
        event.setTotalSeats(request.getTotalSeats());
        event.setAvailableSeats(newAvailableSeats);
        event.setStreamUrl(request.getStreamUrl());

        Event updatedEvent = eventRepository.save(event);
        return EventResponse.fromEntity(updatedEvent);
    }

    @Transactional
    public void deleteEvent(Long id, String userEmail) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        boolean isOrganizer = event.getOrganizer().getId().equals(user.getId());
        boolean isAdmin = "ROLE_ADMIN".equalsIgnoreCase(user.getRole());

        if (!isOrganizer && !isAdmin) {
            throw new RuntimeException("Unauthorized to delete this event");
        }

        eventRepository.delete(event);
    }
}
