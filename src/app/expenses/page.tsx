'use client';

import layoutStyles from '../../styles/css/page.module.css';
import styles from '../../styles/css/expenses.module.css';

export default function ExpensesPage() {
  return (
    <div className={layoutStyles.dashboard}>
      <main className={layoutStyles.dashboardBody}>
        <div className={styles.expensesPage}>
          <div className="container">
            <header className={styles.header}>
              <h1 className={styles.title}>지출 등록</h1>
              <p className={styles.subtitle}>가계부 스타일로 지출을 빠르게 기록하세요.</p>
            </header>

            <section className={styles.formSection}>
              <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>날짜</label>
                    <input type="date" className={styles.input} defaultValue={new Date().toISOString().slice(0, 10)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>결제수단</label>
                    <select className={styles.select} defaultValue="카드">
                      <option>현금</option>
                      <option>카드</option>
                      <option>이체</option>
                      <option>간편결제</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>카드사</label>
                    <select className={styles.select} defaultValue="신한">
                      <option>신한</option>
                      <option>현대</option>
                      <option>국민</option>
                      <option>롯데</option>
                      <option>기타</option>
                    </select>
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>카테고리</label>
                    <select className={styles.select} defaultValue="식비">
                      <option>식비</option>
                      <option>교통</option>
                      <option>쇼핑</option>
                      <option>여가</option>
                      <option>고정비</option>
                      <option>기타</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>금액</label>
                    <input type="number" className={styles.input} min={0} step={100} placeholder="0" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>가맹점/메모</label>
                    <input type="text" className={styles.input} placeholder="예: 스타벅스, 점심" />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>지출 형태</label>
                    <div className={styles.segmented}>
                      <label><input type="radio" name="spendingType" defaultChecked /> 일시불</label>
                      <label><input type="radio" name="spendingType" /> 구독</label>
                      <label><input type="radio" name="spendingType" /> 할부</label>
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>할부 개월수</label>
                    <input type="number" className={styles.input} min={0} max={60} placeholder="0" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>첨부</label>
                    <input type="file" className={styles.input} />
                  </div>
                </div>

                <div className={styles.actions}>
                  <button className={styles.buttonPrimary} type="submit">등록</button>
                  <button className={styles.buttonGhost} type="reset">초기화</button>
                </div>
              </form>
            </section>

            <section className={styles.listSection}>
              <h2 className={styles.sectionTitle}>오늘의 지출</h2>
              <div className={styles.ledgerList}>
                {[1,2,3].map((i) => (
                  <div key={i} className={styles.ledgerItem}>
                    <div className={styles.ledgerLeft}>
                      <div className={styles.ledgerDate}>2024-09-0{i}</div>
                      <div className={styles.ledgerMerchant}>스타벅스</div>
                    </div>
                    <div className={styles.ledgerRight}>
                      <span className={styles.ledgerCategory}>식비</span>
                      <span className={styles.ledgerAmount}>-5,200원</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
} 