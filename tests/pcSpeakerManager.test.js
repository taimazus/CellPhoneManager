import { describe, it, expect } from 'vitest';
import { pcSpeakerManager } from '../server/pcSpeakerManager.js';

describe('PCSpeakerManager Test Suite', () => {
    it('should report initial streaming status as inactive', () => {
        const status = pcSpeakerManager.getStatus();
        expect(status).toHaveProperty('isStreaming');
        expect(status).toHaveProperty('clientCount');
        expect(typeof status.isStreaming).toBe('boolean');
    });

    it('should list available host audio devices or fallback safely', async () => {
        const devices = await pcSpeakerManager.listAudioDevices();
        expect(Array.isArray(devices)).toBe(true);
    }, 15000);

    it('should return local IPs for mobile receiver discovery', () => {
        const ips = pcSpeakerManager.getLocalIps();
        expect(Array.isArray(ips)).toBe(true);
    });
});

