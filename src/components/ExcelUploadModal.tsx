'use client';

import { useState, useEffect, useRef } from 'react';
import styles from '../styles/css/ExcelUploadModal.module.css';
import {getCategories} from "@/lib/api/commonCodes";

interface ExcelRow {
  rowNumber: number;
  거래유형: string;
  거래일자: string;
  금액: number;
  카테고리: string;
  메모?: string;
}

interface ProcessedRow extends ExcelRow {
  status: 'pending' | 'processing' | 'success' | 'error';
  errorMessage?: string;
}

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File;
  usr_id: string;
  wlt_id: string;
  onComplete: (result: { success: number; failed: number; errors: any[] }) => void;
}

export default function ExcelUploadModal({ 
  isOpen, 
  onClose, 
  file, 
  usr_id, 
  wlt_id, 
  onComplete 
}: ExcelUploadModalProps) {
  const [rows, setRows] = useState<ProcessedRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'loading' | 'processing' | 'completed'>('loading');
  const [progress, setProgress] = useState(0);
  const [categoryMapping, setCategoryMapping] = useState<Record<string, string>>({});
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isOpen && file && !hasInitialized.current) {
      hasInitialized.current = true;
      loadExcelData();
    }
  }, [isOpen, file]);

  // 모달이 닫힐 때 초기화
  useEffect(() => {
    if (!isOpen) {
      hasInitialized.current = false;
      setRows([]);
      setProgress(0);
      setCurrentStep('loading');
      // setCategoryMapping({});
    }
  }, [isOpen]);

  const loadExcelData = async () => {
    setIsLoading(true);
    setCurrentStep('loading');

    try {
      // 카테고리 매핑을 미리 조회
      const categoryData = await getCategories();

      //TODO setCategoryMapping(mapping);을 했는데 categoryMapping에서 왜 못 불러오지?
      const mapping: Record<string, string> = {};
      categoryData.forEach((c) => {
        mapping[c.cd_nm] = c.cd;
        categoryMapping[c.cd_nm] = c.cd;
      })

      setCategoryMapping(mapping);

      // ExcelJS를 사용하여 파일 읽기
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('엑셀 파일에 워크시트가 없습니다.');
      }

      const loadedRows: ProcessedRow[] = [];
      let rowNumber = 2; // 헤더 다음 행부터 시작

      worksheet.eachRow((row, rowIndex) => {
        if (rowIndex === 1) return; // 헤더 건너뛰기

        try {
          const rowData: ExcelRow = {
            rowNumber,
            거래유형: row.getCell(1).value as string,
            거래일자: toYmd(row.getCell(2).value),
            금액: Number(row.getCell(3).value),
            카테고리: row.getCell(4).value as string,
            메모: row.getCell(5).value as string || ''
          };

          // 데이터 검증
          if (!rowData.거래유형 || !rowData.거래일자 || !rowData.금액 || !rowData.카테고리) {
            throw new Error('필수 필드가 누락되었습니다.');
          }

          if (rowData.금액 <= 0) {
            throw new Error('금액은 0보다 커야 합니다.');
          }

          // 거래유형 매핑
          const trx_type = rowData.거래유형 === '수입' ? 'INCOME' : 
                          rowData.거래유형 === '지출' ? 'EXPENSE' : null;
          if (!trx_type) {
            throw new Error('거래유형은 "수입" 또는 "지출"이어야 합니다.');
          }

          // 날짜 형식 검증
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(rowData.거래일자)) {
            throw new Error('날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)');
          }

          // 카테고리 매핑 검증
          const category_cd = mapping[rowData.카테고리];
          if (!category_cd) {
            throw new Error(`알 수 없는 카테고리입니다: ${rowData.카테고리}`);
          }

          loadedRows.push({
            ...rowData,
            status: 'pending'
          });
        } catch (error: any) {
          loadedRows.push({
            rowNumber,
            거래유형: row.getCell(1).value as string || '',
            거래일자: row.getCell(2).value as string || '',
            금액: Number(row.getCell(3).value) || 0,
            카테고리: row.getCell(4).value as string || '',
            메모: row.getCell(5).value as string || '',
            status: 'error',
            errorMessage: error.message || '알 수 없는 오류'
          });
        }

        rowNumber++;
      });

      setRows(loadedRows);
      setCurrentStep('processing');
      setIsLoading(false);
      
      // 데이터 로드 완료 후 자동으로 처리 시작
      setTimeout(() => {
        processRows(loadedRows, mapping);
      }, 1000);
    } catch (error: any) {
      console.error('엑셀 로드 오류:', error);
      setIsLoading(false);
      alert('엑셀 파일을 읽는 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const processRows = async (rowsToProcess: ProcessedRow[], mapping: Record<string, string>) => {
    setCurrentStep('processing');
    let successCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    for (let i = 0; i < rowsToProcess.length; i++) {
      const row = rowsToProcess[i];
      
      // 이미 오류가 있는 행은 건너뛰기
      if (row.status === 'error') {
        failedCount++;
        errors.push({
          row: row.rowNumber,
          error: row.errorMessage
        });
        continue;
      }

      // 처리 중 상태로 변경
      setRows(prev => prev.map(r => 
        r.rowNumber === row.rowNumber 
          ? { ...r, status: 'processing' }
          : r
      ));

      try {
        // 거래유형 매핑
        const trx_type = row.거래유형 === '수입' ? 'INCOME' : 'EXPENSE';
        const category_cd = mapping[row.카테고리];

        if (!category_cd) {
          throw new Error(`알 수 없는 카테고리입니다: ${row.카테고리}`);
        }

        // 거래 등록 API 호출
        const response = await fetch('/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            usr_id,
            wlt_id,
            trx_type,
            trx_date: row.거래일자,
            amount: row.금액,
            category_cd,
            memo: row.메모 || null,
            is_fixed: 'N',
            is_installment: 'N'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '거래 등록 실패');
        }

        // 성공 상태로 변경
        setRows(prev => prev.map(r => 
          r.rowNumber === row.rowNumber 
            ? { ...r, status: 'success' }
            : r
        ));
        
        successCount++;
      } catch (error: any) {
        // 실패 상태로 변경
        setRows(prev => prev.map(r => 
          r.rowNumber === row.rowNumber 
            ? { ...r, status: 'error', errorMessage: error.message }
            : r
        ));
        
        failedCount++;
        errors.push({
          row: row.rowNumber,
          error: error.message
        });
      }

      // 진행률 업데이트
      setProgress(((i + 1) / rowsToProcess.length) * 100);
      
      // UI 업데이트를 위한 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCurrentStep('completed');
    // onComplete는 호출하지 않고 사용자가 직접 닫도록 함
  };

  const handleClose = () => {
    if (currentStep === 'completed') {
      // 완료된 경우에만 결과를 전달하고 닫기
      const successCount = rows.filter(row => row.status === 'success').length;
      const failedCount = rows.filter(row => row.status === 'error').length;
      const errors = rows
        .filter(row => row.status === 'error')
        .map(row => ({
          row: row.rowNumber,
          error: row.errorMessage
        }));
      
      onComplete({ success: successCount, failed: failedCount, errors });
    }
    // onClose();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'processing':
        return '🔄';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '대기중';
      case 'processing':
        return '처리중';
      case 'success':
        return '완료';
      case 'error':
        return '실패';
      default:
        return '대기중';
    }
  };

  const toYmd = (v: any) => {
    // 1) Date 객체인 경우
    if (v instanceof Date) {
      const y = v.getFullYear();
      const m = String(v.getMonth() + 1).padStart(2, '0');
      const d = String(v.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    // 2) 엑셀 일련번호(숫자)인 경우 (시리얼 → JS Date 변환)
    if (typeof v === 'number') {
      // Excel serial date -> JS Date
      const jsDate = new Date(Math.round((v - 25569) * 86400 * 1000));
      const y = jsDate.getFullYear();
      const m = String(jsDate.getMonth() + 1).padStart(2, '0');
      const d = String(jsDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    // 3) 문자열인 경우
    if (typeof v === 'string') {
      return v.trim();
    }
    // 그 외(빈값 등)
    return '';
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>엑셀 데이터 처리</h2>
          <button 
            className={styles.closeButton} 
            onClick={handleClose}
            disabled={currentStep === 'processing'}
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* 진행 상태 */}
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span className={styles.stepIndicator}>
                {currentStep === 'loading' && '📖 엑셀 파일 읽는 중...'}
                {currentStep === 'processing' && '⚙️ 데이터 처리 중...'}
                {currentStep === 'completed' && '🎉 처리 완료!'}
              </span>
            </div>
            
            {currentStep === 'processing' && (
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>

          {/* 데이터 목록 */}
          <div className={styles.dataList}>
            <div className={styles.dataListHeader}>
              <span>행</span>
              <span>거래유형</span>
              <span>거래일자</span>
              <span>금액</span>
              <span>카테고리</span>
              <span>메모</span>
              <span>상태</span>
            </div>
            
            <div className={styles.dataListBody}>
              {rows.map((row) => (
                <div key={row.rowNumber} className={styles.dataRow}>
                  <span className={styles.rowNumber}>{row.rowNumber}</span>
                  <span className={styles.trxType}>{row.거래유형}</span>
                  <span className={styles.trxDate}>{row.거래일자}</span>
                  <span className={styles.amount}>{row.금액.toLocaleString()}원</span>
                  <span className={styles.category}>{row.카테고리}</span>
                  <span className={styles.memo}>{row.메모 || '-'}</span>
                  <span className={`${styles.status} ${styles[row.status]}`}>
                    {getStatusIcon(row.status)} {getStatusText(row.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 오류 메시지 */}
          {rows.some(row => row.status === 'error') && (
            <div className={styles.errorSection}>
              <h4>오류 상세</h4>
              {rows
                .filter(row => row.status === 'error')
                .map((row) => (
                  <div key={row.rowNumber} className={styles.errorItem}>
                    <strong>행 {row.rowNumber}:</strong> {row.errorMessage}
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button 
            className={styles.buttonSecondary} 
            onClick={handleClose}
            disabled={currentStep === 'processing'}
          >
            {currentStep === 'completed' ? '닫기' : '취소'}
          </button>
        </div>
      </div>
    </div>
  );
}
