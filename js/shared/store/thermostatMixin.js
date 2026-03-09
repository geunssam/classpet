/**
 * 온도계 보상체계 Mixin
 * 학급 칭찬 누적 → 온도 상승 → 마일스톤 보상
 * pe-picker 로직 이식
 */

import { STORAGE_KEYS } from '../../shared/store/Store.js';

/** 기본 온도계 설정 */
export const DEFAULT_THERMOSTAT = {
    targetPraises: 200,
    milestones: [
        { temp: 20, reward: '야외 수업 1회' },
        { temp: 40, reward: '자유시간 5분' },
        { temp: 60, reward: '과자파티' },
        { temp: 70, reward: '교장놀이 1시간' },
        { temp: 90, reward: '체육 1시간!' },
        { temp: 100, reward: '영화 보기' },
    ],
};

export const thermostatMixin = {
    // ==================== 온도계 설정 ====================

    /**
     * 온도계 설정 전체 가져오기
     */
    getAllThermostatSettings() {
        const data = localStorage.getItem(STORAGE_KEYS.THERMOSTAT);
        return data ? JSON.parse(data) : {};
    },

    /**
     * 현재 학급 온도계 설정 가져오기
     */
    getThermostatSettings() {
        const classId = this.getCurrentClassId() || '_local';
        const all = this.getAllThermostatSettings();
        return all[classId] || { ...DEFAULT_THERMOSTAT };
    },

    /**
     * 온도계 설정 저장
     */
    saveThermostatSettings(settings) {
        const classId = this.getCurrentClassId() || '_local';
        const all = this.getAllThermostatSettings();
        all[classId] = settings;
        localStorage.setItem(STORAGE_KEYS.THERMOSTAT, JSON.stringify(all));
        this.notify('thermostat', settings);
    },

    // ==================== 온도 계산 ====================

    /**
     * 학급 전체 칭찬 수 (누적)
     */
    getClassTotalPraises() {
        const log = this.getPraiseLog() || [];
        return log.length;
    },

    /**
     * 현재 온도 계산 (0~100)
     */
    getThermoTemp() {
        const settings = this.getThermostatSettings();
        const total = this.getClassTotalPraises();
        return Math.min(100, Math.round((total / settings.targetPraises) * 100));
    },

    /**
     * 달성된 마일스톤 목록
     */
    getAchievedMilestones() {
        const temp = this.getThermoTemp();
        const settings = this.getThermostatSettings();
        return (settings.milestones || []).filter(ms => temp >= ms.temp);
    },

    /**
     * 다음 마일스톤 정보
     */
    getNextMilestone() {
        const temp = this.getThermoTemp();
        const settings = this.getThermostatSettings();
        const sorted = [...(settings.milestones || [])].sort((a, b) => a.temp - b.temp);
        return sorted.find(ms => ms.temp > temp) || null;
    },
};
