import { describe, it, expect, beforeEach } from 'vitest';
import { notificationManager } from '../server/notificationManager.js';

describe('NotificationManager Live Events Suite', () => {
  const deviceId = 'test-device-notif-101';

  beforeEach(() => {
    notificationManager.clearEvents(deviceId);
  });

  it('should simulate an incoming SMS event and retrieve unread count', async () => {
    const event = notificationManager.simulateEvent(deviceId, {
      category: 'sms',
      title: 'پیامک تست',
      text: 'سلام! کد تایید شما ۱۲۳۴ است.',
      sender: '09121234567'
    });

    expect(event).toBeDefined();
    expect(event.category).toBe('sms');
    expect(event.read).toBe(false);

    const { events, unreadCount } = await notificationManager.getEvents(deviceId);
    expect(events.length).toBe(1);
    expect(unreadCount).toBe(1);
    expect(events[0].id).toBe(event.id);
  });

  it('should mark a specific event as read and decrement unreadCount', async () => {
    const ev1 = notificationManager.simulateEvent(deviceId, { category: 'call', title: 'تماس ناموفق' });
    const ev2 = notificationManager.simulateEvent(deviceId, { category: 'sms', title: 'پیامک دوم' });

    let state = await notificationManager.getEvents(deviceId);
    expect(state.unreadCount).toBe(2);

    const res = notificationManager.markAsRead(deviceId, ev1.id);
    expect(res.success).toBe(true);

    state = await notificationManager.getEvents(deviceId);
    expect(state.unreadCount).toBe(1);

    const found = state.events.find(e => e.id === ev1.id);
    expect(found?.read).toBe(true);
  });

  it('should mark all events as read', async () => {
    notificationManager.simulateEvent(deviceId, { category: 'notification', title: 'اعلان ۱' });
    notificationManager.simulateEvent(deviceId, { category: 'sms', title: 'پیامک ۲' });

    const res = notificationManager.markAllAsRead(deviceId);
    expect(res.success).toBe(true);

    const state = await notificationManager.getEvents(deviceId);
    expect(state.unreadCount).toBe(0);
    expect(state.events.every(e => e.read)).toBe(true);
  });

  it('should clear all events for device', async () => {
    notificationManager.simulateEvent(deviceId, { category: 'sms' });
    notificationManager.simulateEvent(deviceId, { category: 'call' });

    notificationManager.clearEvents(deviceId);
    const state = await notificationManager.getEvents(deviceId);
    expect(state.events.length).toBe(0);
    expect(state.unreadCount).toBe(0);
  });

  it('should parse real android dumpsys notifications correctly', () => {
    const sampleOutput = `
NotificationRecord(0x1234: pkg=com.google.android.apps.messaging user=UserHandle{0} id=101 tag=null: Notification(channel=sms_channel pri=1))
  android.title=String (مادر)
  android.text=String (رسیدی خبر بده)
NotificationRecord(0x5678: pkg=com.google.android.dialer user=UserHandle{0} id=102 tag=null: Notification(channel=calls pri=2))
  android.title=String (تماس از دست رفته)
  android.text=String (09129876543)
    `;

    const parsed = notificationManager.parseNotificationsFromStdout(sampleOutput);
    expect(parsed.length).toBe(2);
    expect(parsed[0].category).toBe('sms');
    expect(parsed[0].title).toBe('مادر');
    expect(parsed[0].text).toBe('رسیدی خبر بده');
    expect(parsed[1].category).toBe('call');
    expect(parsed[1].title).toBe('تماس از دست رفته');
  });
});
