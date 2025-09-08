// 올바른 ledger 구조로 수정
const correctLedgerStructure = `
                    <div key={expense.trx_id} className={styles.ledgerItem}>
                      <div className={styles.ledgerLeft}>
                        <div className={styles.ledgerDate}>{formatDate(expense.trx_date)}</div>
                        <div className={styles.ledgerMerchant}>
                          {expense.memo || '메모 없음'}
                          {expense.installment_info && (
                            <span className={styles.ledgerInstallment}>
                              ({expense.installment_info})
                            </span>
                          )}
                        </div>
                        <div className={styles.ledgerWallet}>{expense.wlt_name}</div>
                      </div>
                      <div className={styles.ledgerRight}>
                        <span className={styles.ledgerCategory}>{expense.category_name}</span>
                        <span className={styles.ledgerAmount}>-{formatKRW(expense.amount)}원</span>
                      </div>
                    </div>`;
