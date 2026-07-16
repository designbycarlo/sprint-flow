"use client";
import React, { useState, useEffect } from 'react';
import styles from './Board.module.css';

function getGreeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function WelcomeWidget({ name }: { name?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!now) {
    return <div className={styles.welcomeWidget} aria-hidden="true" />;
  }

  const greeting = getGreeting(now.getHours());
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeLabel = now.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <section className={styles.welcomeWidget} aria-label="Welcome">
      <div className={styles.welcomeMain}>
        <span className={styles.welcomeGreeting}>
          {greeting}{name ? `, ${name}` : ''}
        </span>
        <span className={styles.welcomeDivider} aria-hidden="true">•</span>
        <time className={styles.welcomeDate} dateTime={now.toISOString()}>
          {dateLabel}
        </time>
      </div>
      <time className={styles.welcomeTime} dateTime={now.toISOString()}>
        {timeLabel}
      </time>
    </section>
  );
}
