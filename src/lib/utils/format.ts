/**
 * 공통 포맷팅 유틸리티 함수
 */

/**
 * 문자열 금액을 원단위 콤마 처리
 * @param amount - 금액 문자열 또는 숫자
 * @returns 콤마가 추가된 금액 문자열
 * 
 * @example
 * formatCurrency('1000000') // '1,000,000'
 * formatCurrency(1000000) // '1,000,000'
 * formatCurrency('') // '0'
 * formatCurrency(null) // '0'
 */
export function formatCurrency(amount: string | number | null | undefined): string {
  // null, undefined, 빈 문자열 체크
  if (amount === null || amount === undefined) {
    return '0';
  }

  // 빈 문자열 체크
  if (amount === '' || (typeof amount === 'string' && amount.trim() === '')) {
    return '0';
  }

  let numAmount: number;

  // 타입에 따라 숫자로 변환
  if (typeof amount === 'number') {
    numAmount = amount;
  } else if (typeof amount === 'string') {
    // 콤마 제거 후 숫자로 변환
    const cleaned = amount.replace(/,/g, '').trim();
    numAmount = parseFloat(cleaned);
  } else {
    return '0';
  }

  // 유효하지 않은 숫자인 경우
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    return '0';
  }

  // 소수점 이하 제거하고 콤마 추가
  return Math.floor(Math.abs(numAmount)).toLocaleString('ko-KR');
}

/**
 * 콤마가 포함된 금액 문자열에서 콤마 제거
 * @param amount - 콤마가 포함된 금액 문자열
 * @returns 콤마가 제거된 금액 문자열
 * 
 * @example
 * removeCommas('1,000,000') // '1000000'
 * removeCommas('1,000.50') // '1000.50'
 */
export function removeCommas(amount: string): string {
  if (!amount) return '';
  return amount.toString().replace(/,/g, '');
}

