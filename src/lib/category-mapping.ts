// 카테고리 매핑 데이터
// 메모 키워드와 카테고리의 매핑 관계를 정의합니다.
export const categoryMappingData = [
  // 식비
  { memo_keyword: '카페', category: '식비' },
  { memo_keyword: '커피', category: '식비' },
  { memo_keyword: '스타벅스', category: '식비' },
  { memo_keyword: '맥도날드', category: '식비' },
  { memo_keyword: '버거킹', category: '식비' },
  { memo_keyword: '치킨', category: '식비' },
  { memo_keyword: '피자', category: '식비' },
  { memo_keyword: '한식', category: '식비' },
  { memo_keyword: '중식', category: '식비' },
  { memo_keyword: '일식', category: '식비' },
  { memo_keyword: '양식', category: '식비' },
  { memo_keyword: '편의점', category: '식비' },
  { memo_keyword: '마트', category: '식비' },
  { memo_keyword: '점심', category: '식비' },
  { memo_keyword: '저녁', category: '식비' },
  { memo_keyword: '아침', category: '식비' },
  { memo_keyword: '외식', category: '식비' },
  { memo_keyword: '분식', category: '식비' },
  { memo_keyword: '패스트푸드', category: '식비' },
  { memo_keyword: '배달음식', category: '식비' },
  { memo_keyword: '술자리', category: '식비' },
  { memo_keyword: '슈퍼마켓', category: '식비' },

  // 장보기
  { memo_keyword: '마트', category: '장보기' },
  { memo_keyword: '편의점', category: '장보기' },
  { memo_keyword: '재래시장', category: '장보기' },
  { memo_keyword: '식자재', category: '장보기' },
  { memo_keyword: '슈퍼', category: '장보기' },
  { memo_keyword: '코스트코', category: '장보기' },
  { memo_keyword: '홈플러스', category: '장보기' },

  // 교통비
  { memo_keyword: '지하철', category: '교통비' },
  { memo_keyword: '버스', category: '교통비' },
  { memo_keyword: '택시', category: '교통비' },
  { memo_keyword: '주유', category: '교통비' },
  { memo_keyword: '주차', category: '교통비' },
  { memo_keyword: '고속도로', category: '교통비' },
  { memo_keyword: 'KTX', category: '교통비' },
  { memo_keyword: '교통카드 충전', category: '교통비' },

  // 건강
  { memo_keyword: '병원', category: '건강' },
  { memo_keyword: '약국', category: '건강' },
  { memo_keyword: '치과', category: '건강' },
  { memo_keyword: '안과', category: '건강' },
  { memo_keyword: '건강검진', category: '건강' },

  // 교육
  { memo_keyword: '학원', category: '교육' },
  { memo_keyword: '교재', category: '교육' },
  { memo_keyword: '온라인강의', category: '교육' },
  { memo_keyword: '등록금', category: '교육' },
  { memo_keyword: '세미나', category: '교육' },
  { memo_keyword: '도서', category: '교육' },

  // 여가/취미
  { memo_keyword: '게임', category: '여가/취미' },
  { memo_keyword: '캠핑', category: '여가/취미' },
  { memo_keyword: '낚시', category: '여가/취미' },
  { memo_keyword: '사진', category: '여가/취미' },
  { memo_keyword: '운동용품', category: '여가/취미' },
  { memo_keyword: '취미활동', category: '여가/취미' },
  { memo_keyword: '헬스장', category: '여가/취미' },
  { memo_keyword: '수영장', category: '여가/취미' },
  { memo_keyword: '골프', category: '여가/취미' },
  { memo_keyword: '볼링', category: '여가/취미' },
  { memo_keyword: '당구', category: '여가/취미' },
  { memo_keyword: 'PC방', category: '여가/취미' },
  { memo_keyword: '노래방', category: '여가/취미' },
  { memo_keyword: '카라오케', category: '여가/취미' },
  { memo_keyword: '스크린', category: '여가/취미' },

  // 모임/경조사
  { memo_keyword: '회식', category: '모임/경조사' },
  { memo_keyword: '모임', category: '모임/경조사' },
  { memo_keyword: '축의금', category: '모임/경조사' },
  { memo_keyword: '부의금', category: '모임/경조사' },
  { memo_keyword: '선물', category: '모임/경조사' },
  { memo_keyword: '동창회', category: '모임/경조사' },

  // 쇼핑
  { memo_keyword: '네이버', category: '쇼핑' },
  { memo_keyword: '쿠팡', category: '쇼핑' },
  { memo_keyword: '11번가', category: '쇼핑' },
  { memo_keyword: 'G마켓', category: '쇼핑' },
  { memo_keyword: '옥션', category: '쇼핑' },
  { memo_keyword: '아마존', category: '쇼핑' },
  { memo_keyword: '이마트', category: '쇼핑' },
  { memo_keyword: '롯데마트', category: '쇼핑' },
  { memo_keyword: '홈플러스', category: '쇼핑' },
  { memo_keyword: '코스트코', category: '쇼핑' },
  { memo_keyword: '현대백화점', category: '쇼핑' },
  { memo_keyword: '롯데백화점', category: '쇼핑' },
  { memo_keyword: '신세계백화점', category: '쇼핑' },

  // 육아
  { memo_keyword: '기저귀', category: '육아' },
  { memo_keyword: '분유', category: '육아' },
  { memo_keyword: '장난감', category: '육아' },
  { memo_keyword: '아동복', category: '육아' },
  { memo_keyword: '학습지', category: '육아' },
  { memo_keyword: '유치원비', category: '육아' },

  // 문화생활
  { memo_keyword: 'CGV', category: '문화생활' },
  { memo_keyword: '롯데시네마', category: '문화생활' },
  { memo_keyword: '메가박스', category: '문화생활' },
  { memo_keyword: '영화', category: '문화생활' },
  { memo_keyword: '콘서트', category: '문화생활' },
  { memo_keyword: '뮤지컬', category: '문화생활' },
  { memo_keyword: '연극', category: '문화생활' },
  { memo_keyword: '전시회', category: '문화생활' },
  { memo_keyword: '도서관', category: '문화생활' },
  { memo_keyword: '서점', category: '문화생활' },
  { memo_keyword: '책', category: '문화생활' },
  { memo_keyword: '스포츠', category: '문화생활' },

  // 반려동물
  { memo_keyword: '사료', category: '반려동물' },
  { memo_keyword: '간식', category: '반려동물' },
  { memo_keyword: '동물병원', category: '반려동물' },
  { memo_keyword: '미용', category: '반려동물' },
  { memo_keyword: '용품', category: '반려동물' },

  // 금융비용
  { memo_keyword: '이자', category: '금융비용' },
  { memo_keyword: '수수료', category: '금융비용' },
  { memo_keyword: '대출이자', category: '금융비용' },
  { memo_keyword: '신용카드 연회비', category: '금융비용' },
  { memo_keyword: '보험', category: '금융비용' },
  { memo_keyword: '생명보험', category: '금융비용' },
  { memo_keyword: '손해보험', category: '금융비용' },
  { memo_keyword: '자동차보험', category: '금융비용' },
  { memo_keyword: '건강보험', category: '금융비용' },
  { memo_keyword: '연금', category: '금융비용' },

  // 생활비
  { memo_keyword: '세제', category: '생활비' },
  { memo_keyword: '휴지', category: '생활비' },
  { memo_keyword: '청소용품', category: '생활비' },
  { memo_keyword: '생활용품', category: '생활비' },
  { memo_keyword: '생필품', category: '생활비' },
  { memo_keyword: '스마트폰', category: '생활비' },
  { memo_keyword: '인터넷', category: '생활비' },
  { memo_keyword: '통신비', category: '생활비' },
  { memo_keyword: '요금제', category: '생활비' },

  // 구독형 지출
  { memo_keyword: '넷플릭스', category: '구독형 지출' },
  { memo_keyword: '유튜브프리미엄', category: '구독형 지출' },
  { memo_keyword: '스포티파이', category: '구독형 지출' },
  { memo_keyword: '멜론', category: '구독형 지출' },
  { memo_keyword: '클라우드', category: '구독형 지출' },
  { memo_keyword: 'OTT', category: '구독형 지출' },
  { memo_keyword: '와우', category: '구독형 지출' },
  { memo_keyword: '디즈니플러스', category: '구독형 지출' },
  { memo_keyword: '웨이브', category: '구독형 지출' },
  { memo_keyword: '웨이브', category: '구독형 지출' },
  { memo_keyword: '왓챠', category: '구독형 지출' },
  { memo_keyword: '신문구독', category: '구독형 지출' },
  { memo_keyword: '멤버십', category: '구독형 지출' },


  // 공과금
  { memo_keyword: '전기', category: '공과금' },
  { memo_keyword: '가스', category: '공과금' },
  { memo_keyword: '수도', category: '공과금' },
  { memo_keyword: '관리비', category: '공과금' },
  { memo_keyword: '아파트', category: '공과금' },
  { memo_keyword: '오피스텔', category: '공과금' },
  { memo_keyword: '원룸', category: '공과금' },
  { memo_keyword: '월세', category: '공과금' },
  { memo_keyword: '전세', category: '공과금' },

  // 기타
  { memo_keyword: '예비비', category: '기타' },
  { memo_keyword: '잡비', category: '기타' },
  { memo_keyword: '분류불가', category: '기타' },
  { memo_keyword: '기타지출', category: '기타' }
];
