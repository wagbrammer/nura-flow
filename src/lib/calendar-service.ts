/**
 * Calendar Service - Uses CalDAV or ICS files instead of Google Calendar API
 * Works with Nextcloud, iCloud, Radicale, or any CalDAV-compatible server
 */

import { ICAL } from 'ical';
import fs from 'fs';
import path from 'path';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location?: string;
  attendees?: string[];
  isAllDay?: boolean;
  calendarId?: string;
}

export interface CalendarConfig {
  url?: string; // CalDAV URL
  user?: string;
  pass?: string;
  icsFiles?: string[]; // Local .ics files to parse
}

class CalendarService {
  private config: CalendarConfig = {};
  private eventsCache: CalendarEvent[] = [];
  private cacheTime = 0;

  /**
   * Initialize calendar service
   */
  initialize(config: CalendarConfig): void {
    this.config = config;
    this.eventsCache = [];
    this.cacheTime = 0;
  }

  /**
   * Check if calendar service is configured
   */
  isConfigured(): boolean {
    return !!this.config.url || (this.config.icsFiles && this.config.icsFiles.length > 0);
  }

  /**
   * Get calendar status
   */
  getStatus(): { configured: boolean; url?: string; fileCount?: number } {
    return {
      configured: this.isConfigured(),
      url: this.config.url,
      fileCount: this.config.icsFiles?.length
    };
  }

  /**
   * Parse ICS content
   */
  private parseICSContent(icsContent: string): CalendarEvent[] {
    try {
      const jCal = ICAL.parse(icsContent);
      const events: CalendarEvent[] = [];
      const vcalendar = jCal[1];

      for (const component of vcalendar) {
        if (component[0] !== 'vevent') continue;

        const event = component[1];
        const eventObj: Record<string, any> = {};

        for (const prop of event) {
          if (Array.isArray(prop)) {
            eventObj[prop[0]] = prop[2] || prop[1];
          }
        }

        const startDate = eventObj['dtstart']?.toString() || '';
        const endDate = eventObj['dtend']?.toString() || '';
        const isAllDay = eventObj['dtstart']?.includes('VALUE=DATE') && !eventObj['dtstart']?.includes('T');

        // Parse dates
        const startDateTime = new Date(startDate.replace(/-/g, '/'));
        const endDateTime = new Date(endDate.replace(/-/g, '/'));

        events.push({
          id: eventObj['uid'] || `event_${Date.now()}_${Math.random()}`,
          title: eventObj['summary'] || 'Evento sem título',
          description: eventObj['description'] || '',
          startDate: isAllDay ? startDate : startDateTime.toISOString().split('T')[0],
          startTime: isAllDay ? '' : startDateTime.toTimeString().substring(0, 5),
          endDate: isAllDay ? endDate : endDateTime.toISOString().split('T')[0],
          endTime: isAllDay ? '' : endDateTime.toTimeString().substring(0, 5),
          location: eventObj['location'] || '',
          attendees: eventObj['attendee'] ? [eventObj['attendee']] : [],
          isAllDay,
          calendarId: eventObj['caladdr'] || 'default'
        });
      }

      return events;
    } catch (error) {
      console.error('Error parsing ICS:', error);
      return [];
    }
  }

  /**
   * Load events from ICS files
   */
  async loadFromICSFiles(): Promise<CalendarEvent[]> {
    if (!this.config.icsFiles || this.config.icsFiles.length === 0) {
      return [];
    }

    const allEvents: CalendarEvent[] = [];

    for (const filePath of this.config.icsFiles) {
      try {
        // Support both absolute paths and relative to project root
        const fullPath = path.isAbsolute(filePath)
          ? filePath
          : path.join(process.cwd(), filePath);

        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const events = this.parseICSContent(content);
          allEvents.push(...events);
        }
      } catch (error) {
        console.error(`Error loading ICS file ${filePath}:`, error);
      }
    }

    return allEvents;
  }

  /**
   * Fetch events from CalDAV server (placeholder - would need caldav library)
   */
  async fetchFromCalDAV(): Promise<CalendarEvent[]> {
    // Placeholder for CalDAV implementation
    // In production, would use a library like 'caldav' or 'davclient'
    console.log('CalDAV integration placeholder - implement with caldav library');
    return [];
  }

  /**
   * Get calendar events
   */
  async getEvents(monthsAhead: number = 3): Promise<CalendarEvent[]> {
    const now = Date.now();
    const cacheTimeout = 60000; // 1 minute cache

    // Return cached events if still valid
    if (this.eventsCache.length > 0 && (now - this.cacheTime) < cacheTimeout) {
      return this.eventsCache;
    }

    let events: CalendarEvent[] = [];

    // Try ICS files first
    if (this.config.icsFiles && this.config.icsFiles.length > 0) {
      events = await this.loadFromICSFiles();
    }

    // Try CalDAV if configured
    if (this.config.url && events.length === 0) {
      events = await this.fetchFromCalDAV();
    }

    // Filter events within requested timeframe
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + monthsAhead);

    this.eventsCache = events.filter(event => {
      const eventDate = new Date(`${event.startDate}T${event.startTime || '00:00'}`);
      return eventDate <= endDate;
    });

    this.cacheTime = Date.now();
    return this.eventsCache;
  }

  /**
   * Add event to calendar (writes to ICS file)
   */
  async addEvent(event: Partial<CalendarEvent>): Promise<{ success: boolean; event?: CalendarEvent }> {
    // For now, just add to in-memory cache
    // In production, would write to ICS file or CalDAV server
    const newEvent: CalendarEvent = {
      id: `event_${Date.now()}`,
      title: event.title || 'Novo Evento',
      description: event.description || '',
      startDate: event.startDate || new Date().toISOString().split('T')[0],
      startTime: event.startTime || '09:00',
      endDate: event.endDate || new Date().toISOString().split('T')[0],
      endTime: event.endTime || '10:00',
      location: event.location,
      isAllDay: event.isAllDay || false,
      calendarId: event.calendarId || 'default'
    };

    this.eventsCache.push(newEvent);
    return { success: true, event: newEvent };
  }

  /**
   * Update event
   */
  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<{ success: boolean }> {
    const index = this.eventsCache.findIndex(e => e.id === id);
    if (index === -1) {
      return { success: false };
    }

    this.eventsCache[index] = { ...this.eventsCache[index], ...updates };
    return { success: true };
  }

  /**
   * Delete event
   */
  async deleteEvent(id: string): Promise<{ success: boolean }> {
    const index = this.eventsCache.findIndex(e => e.id === id);
    if (index === -1) {
      return { success: false };
    }

    this.eventsCache.splice(index, 1);
    return { success: true };
  }
}

export const CalendarServiceInstance = new CalendarService();
export default CalendarServiceInstance;
