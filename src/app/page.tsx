'use client';

import { useState } from 'react';
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  QuestionMarkCircleIcon,
  PlusIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import styles from '../styles/css/page.module.css';

// FAQ 데이터
const faqItems = [
  {
    question: 'What is the page management function?',
    answer: '페이지 관리 기능에 대한 설명입니다.',
  },
  {
    question: 'What are AWS and Docker?',
    answer: 'AWS와 Docker에 대한 설명입니다.',
  },
  {
    question: 'What is a database?',
    answer: '데이터베이스에 대한 설명입니다.',
  },
  {
    question: 'Why are you using Python?',
    answer: 'Python을 사용하는 이유에 대한 설명입니다.',
  },
];

// 최근 로그인 유저 데이터
const recentUsers = [
  { time: '18:30', username: 'test01' },
  { time: '10:30', username: 'impun13043' },
  { time: '09:15', username: 'admin' },
  { time: '08:45', username: 'user123' },
];

// 테이블 데이터
const tableData = [
  { name: 'Airi Satou', position: 'Accountant', office: 'Tokyo', age: 33, startDate: '2008/11/28', salary: '$162,700' },
  { name: 'Angelica Ramos', position: 'Chief Executive Officer (CEO)', office: 'London', age: 47, startDate: '2009/10/09', salary: '$1,200,000' },
  { name: 'Ashton Cox', position: 'Junior Technical Author', office: 'San Francisco', age: 66, startDate: '2009/01/12', salary: '$86,000' },
  { name: 'Bradley Greer', position: 'Software Engineer', office: 'London', age: 41, startDate: '2012/10/13', salary: '$132,000' },
  { name: 'Brenden Wagner', position: 'Software Engineer', office: 'San Francisco', age: 28, startDate: '2011/06/07', salary: '$206,850' },
  { name: 'Brielle Williamson', position: 'Integration Specialist', office: 'New York', age: 61, startDate: '2012/12/02', salary: '$372,000' },
  { name: 'Bruno Nash', position: 'Software Engineer', office: 'London', age: 38, startDate: '2011/05/03', salary: '$163,500' },
  { name: 'Caesar Vance', position: 'Pre-Sales Support', office: 'New York', age: 21, startDate: '2011/12/12', salary: '$106,450' },
  { name: 'Cara Stevens', position: 'Sales Assistant', office: 'New York', age: 46, startDate: '2011/12/06', salary: '$145,600' },
  { name: 'Cedric Kelly', position: 'Senior Javascript Developer', office: 'Edinburgh', age: 22, startDate: '2012/03/29', salary: '$433,060' },
];

export default function Home() {
  const [filterText, setFilterText] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredData = tableData.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(filterText.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className={styles.container}>
      {/* Left Column - Data Table */}
      <div className={`${styles.dataTable} ${styles.dataTableCard}`}>
        <h2 className={styles.title}>데이터블</h2>
        
        {/* Filter and Show Entries */}
        <div className={styles.filterSection}>
          <div className={styles.searchContainer}>
            <MagnifyingGlassIcon className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Type to filter..."
              value={filterText}
              onChange={(e) => {
                setFilterText(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.entriesSelect}>
            <span className={styles.entriesLabel}>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={styles.entriesDropdown}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className={styles.entriesLabel}>entries</span>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeader}>
                <th className={styles.tableHeaderCell}>
                  Name <span className={styles.sortArrow}>↕</span>
                </th>
                <th className={styles.tableHeaderCell}>
                  Position <span className={styles.sortArrow}>↕</span>
                </th>
                <th className={styles.tableHeaderCell}>
                  Office <span className={styles.sortArrow}>↕</span>
                </th>
                <th className={styles.tableHeaderCell}>
                  Age <span className={styles.sortArrow}>↕</span>
                </th>
                <th className={styles.tableHeaderCell}>
                  Start date <span className={styles.sortArrow}>↕</span>
                </th>
                <th className={styles.tableHeaderCell}>
                  Salary <span className={styles.sortArrow}>↕</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => (
                <tr key={index} className={styles.tableBodyRow}>
                  <td className={styles.tableCell}>{row.name}</td>
                  <td className={styles.tableCell}>{row.position}</td>
                  <td className={styles.tableCell}>{row.office}</td>
                  <td className={styles.tableCell}>{row.age}</td>
                  <td className={styles.tableCell}>{row.startDate}</td>
                  <td className={styles.tableCell}>{row.salary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of{' '}
            {filteredData.length} entries
          </div>
          <div className={styles.paginationControls}>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={styles.paginationButton}
            >
              <ChevronLeftIcon style={{ width: '0.9rem', height: '0.9rem' }} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`${styles.paginationPageButton} ${
                  currentPage === page ? styles.paginationPageButtonActive : ''
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={styles.paginationButton}
            >
              <ChevronRightIcon style={{ width: '0.9rem', height: '0.9rem' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - FAQ and Recent Login */}
      <div className={styles.rightColumn}>
        {/* FAQ Panel */}
        <div className={styles.card}>
          <h2 className={styles.title}>FAQ</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {faqItems.map((item, index) => (
              <div key={index} className={styles.faqItem}>
                <button
                  onClick={() => toggleFaq(index)}
                  className={styles.faqButton}
                >
                  <div className={styles.faqQuestion}>
                    <QuestionMarkCircleIcon className={styles.faqIcon} />
                    <span className={styles.faqQuestionText}>{item.question}</span>
                  </div>
                  {expandedFaq === index ? (
                    <MinusIcon style={{ width: '0.9rem', height: '0.9rem', color: '#9ca3af' }} />
                  ) : (
                    <PlusIcon style={{ width: '0.9rem', height: '0.9rem', color: '#9ca3af' }} />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className={styles.faqAnswer}>
                    <p className={styles.faqAnswerText}>{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Login Panel */}
        <div className={styles.card}>
          <h2 className={styles.title}>최근 로그인한 유저</h2>
          <div className={styles.userList}>
            {recentUsers.map((user, index) => (
              <div key={index} className={styles.userItem}>
                <span className={styles.userTime}>{user.time}</span>
                <span className={styles.userName}>{user.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
