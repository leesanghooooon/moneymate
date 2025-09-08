// 카테고리 selectbox 수정
const categorySelectFix = `
                      <option value="" disabled>선택하세요</option>
                      {selectedTrxType === 'EXPENSE' ? categories.map((c) => (
                        <option key={c.cd} value={c.cd}>{c.cd_nm}</option>
                      )) : incomeCategories.map((c) => (
                        <option key={c.cd} value={c.cd}>{c.cd_nm}</option>
                      ))}
`;
