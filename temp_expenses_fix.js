// 오늘의 지출 데이터를 가져오는 함수와 useEffect를 추가해야 할 부분

// 1. 오늘 날짜를 YYYY-MM-DD 형식으로 가져오는 함수
const getTodayDate = () => {
  return new Date().toISOString().slice(0, 10);
};

// 2. 오늘의 지출 데이터를 가져오는 함수
const fetchTodayExpenses = async () => {
  try {
    setLoadingExpenses(true);
    const today = getTodayDate();
    const response = await fetch(`/api/expenses?usr_id=tester01&start_date=${today}&end_date=${today}`);
    
    if (!response.ok) {
      throw new Error('지출 데이터 조회 실패');
    }
    
    const result = await response.json();
    setTodayExpenses(result.data || []);
  } catch (error) {
    console.error('오늘의 지출 조회 오류:', error);
    setTodayExpenses([]);
  } finally {
    setLoadingExpenses(false);
  }
};

// 3. useEffect 추가 (오늘의 지출 데이터 로드)
useEffect(() => {
  fetchTodayExpenses();
}, []);

// 4. 금액을 한국 원화 형식으로 포맷하는 함수
const formatKRW = (amount) => {
  return new Intl.NumberFormat('ko-KR').format(amount);
};

// 5. 날짜를 YYYY-MM-DD에서 MM-DD 형식으로 변환하는 함수
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
