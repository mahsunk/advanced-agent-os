import React from 'react';
import type { DashboardEvent } from '../events';

type Props = {
  events: DashboardEvent[];
};

export function EventFeed({ events }: Props) {
  return (
    <section style={{ marginTop: 32 }}>
      <h2>Live Events</h2>
      <div style={{ border: '1px solid #333', borderRadius: 12, padding: 16 }}>
        {events.map(event => (
          <div key={event.id} style={{ marginBottom: 12 }}>
            <strong>[{event.type}]</strong> {event.message}
            <div style={{ fontSize: 12, opacity: 0.7 }}>{event.timestamp}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
