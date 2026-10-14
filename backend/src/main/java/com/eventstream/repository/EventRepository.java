package com.eventstream.repository;

import com.eventstream.entity.Event;
import com.eventstream.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByOrganizer(User organizer);
    List<Event> findByOrganizerId(Long organizerId);
}
