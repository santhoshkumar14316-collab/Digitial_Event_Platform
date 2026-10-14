package com.eventstream.repository;

import com.eventstream.entity.Ticket;
import com.eventstream.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    Optional<Ticket> findByTicketCode(String ticketCode);
    List<Ticket> findByUser(User user);
    List<Ticket> findByUserId(Long userId);
    List<Ticket> findByEventId(Long eventId);
    Boolean existsByUserIdAndEventId(Long userId, Long eventId);
}
