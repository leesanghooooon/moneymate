/**
 * 날짜 관련 유틸리티 함수들
 */

/**
 * 현재 날짜를 기준으로 당월 1일을 반환합니다.
 * @param date 기준 날짜 (기본값: 현재 날짜)
 * @returns YYYY-MM-DD 형식의 문자열
 */
export function getFirstDayOfMonth(date?: Date): string {
    const targetDate = date || new Date();
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    const firstDay = new Date(year, month, 1);

    // 로컬 기준 YYYY-MM-DD 포맷
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${firstDay.getFullYear()}-${pad(firstDay.getMonth() + 1)}-${pad(firstDay.getDate())}`;
}

/**
 * 현재 날짜를 기준으로 당월 말일을 반환합니다.
 * @param date 기준 날짜 (기본값: 현재 날짜)
 * @returns YYYY-MM-DD 형식의 문자열
 */
export function getLastDayOfMonth(date?: Date): string {
    const targetDate = date || new Date();
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    // 다음 달의 0일 = 이번 달의 마지막 날
    const lastDay = new Date(year, month + 1, 0);

    const pad = (n: number) => String(n).padStart(2, "0");
    return `${lastDay.getFullYear()}-${pad(lastDay.getMonth() + 1)}-${pad(lastDay.getDate())}`;
}

/**
 * 특정 년월의 1일과 말일을 반환합니다.
 * @param year 년도
 * @param month 월 (1-12)
 * @returns { startDate: string, endDate: string }
 */
export function getMonthDateRange(year: number, month: number): { startDate: string; endDate: string } {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // 다음 달의 0일 = 이번 달의 마지막 날

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
    };
}

/**
 * Date 객체를 YYYY-MM-DD 형식의 문자열로 변환합니다.
 * @param date 변환할 Date 객체
 * @returns YYYY-MM-DD 형식의 문자열
 */
export function formatDateToString(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * YYYY-MM-DD 형식의 문자열을 Date 객체로 변환합니다.
 * @param dateString YYYY-MM-DD 형식의 문자열
 * @returns Date 객체
 */
export function parseStringToDate(dateString: string): Date {
    return new Date(dateString + 'T00:00:00');
}

/**
 * 날짜를 한국어 형식으로 포맷합니다.
 * @param date 포맷할 날짜
 * @returns "YYYY년 MM월 DD일" 형식의 문자열
 */
export function formatDateToKorean(date: Date | string): string {
    const targetDate = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');

    return `${year}년 ${month}월 ${day}일`;
}

/**
 * 두 날짜 사이의 일수를 계산합니다.
 * @param startDate 시작 날짜
 * @param endDate 종료 날짜
 * @returns 일수 차이
 */
export function getDaysDifference(startDate: Date | string, endDate: Date | string): number {
    const start = typeof startDate === 'string' ? new Date(startDate + 'T00:00:00') : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate + 'T00:00:00') : endDate;

    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * 날짜에 지정된 일수를 더합니다.
 * @param date 기준 날짜
 * @param days 더할 일수
 * @returns 새로운 Date 객체
 */
export function addDays(date: Date | string, days: number): Date {
    const targetDate = typeof date === 'string' ? new Date(date + 'T00:00:00') : new Date(date);
    targetDate.setDate(targetDate.getDate() + days);
    return targetDate;
}

/**
 * 날짜에 지정된 개월수를 더합니다.
 * @param date 기준 날짜
 * @param months 더할 개월수
 * @returns 새로운 Date 객체
 */
export function addMonths(date: Date | string, months: number): Date {
    const targetDate = typeof date === 'string' ? new Date(date + 'T00:00:00') : new Date(date);
    targetDate.setMonth(targetDate.getMonth() + months);
    return targetDate;
}

/**
 * 현재 시간을 YYYY-MM-DD HH:mm:ss 형식으로 반환합니다.
 * @returns YYYY-MM-DD HH:mm:ss 형식의 문자열
 */
export function getCurrentDateTime(): string {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];
    return `${date} ${time}`;
}

/**
 * Date 객체를 YYYYMMDD 형식의 문자열로 변환합니다 (로컬 시간대 기준).
 * @param date 변환할 Date 객체
 * @returns YYYYMMDD 형식의 문자열
 */
function formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

/**
 * 특정 날짜의 주간 시작일(월요일)을 구합니다.
 * @param date 기준 날짜
 * @returns 주간 시작일 Date 객체
 */
function getWeekStart(date: Date): Date {
    const dayOfWeek = date.getDay(); // 0(일요일) ~ 6(토요일)
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 일요일이면 -6, 그 외에는 1-dayOfWeek
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() + mondayOffset);
    return weekStart;
}

/**
 * 특정 날짜의 주간 종료일(일요일)을 구합니다.
 * @param date 기준 날짜
 * @returns 주간 종료일 Date 객체
 */
function getWeekEnd(date: Date): Date {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return weekEnd;
}

/**
 * 오늘 기준으로 이번 주와 지난 달의 같은 주의 시작일과 종료일을 반환합니다.
 * @param date 기준 날짜 (기본값: 현재 날짜)
 * @returns { thisWeekStart: string, thisWeekEnd: string, lastWeekStart: string, lastWeekEnd: string }
 */
export function getWeekDateRanges(date?: Date): {
    thisWeekStart: string;
    thisWeekEnd: string;
    lastWeekStart: string;
    lastWeekEnd: string;
} {
    const targetDate = date || new Date();

    // 이번 주 시작일과 종료일
    const thisWeekStart = getWeekStart(targetDate);
    const thisWeekEnd = getWeekEnd(targetDate);

    // 지난 달의 같은 주 시작일과 종료일
    // 이번 주 시작일에서 1개월 빼기
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setMonth(thisWeekStart.getMonth() - 1);

    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekStart.getDate() + 6);

    return {
        thisWeekStart: formatDateToYYYYMMDD(thisWeekStart),
        thisWeekEnd: formatDateToYYYYMMDD(thisWeekEnd),
        lastWeekStart: formatDateToYYYYMMDD(lastWeekStart),
        lastWeekEnd: formatDateToYYYYMMDD(lastWeekEnd)
    };
}