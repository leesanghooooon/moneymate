'use client';

import { useState, useEffect, useRef } from 'react';
import styles from '../styles/css/Header.module.css';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';

interface Notification {
  id: string;
  type: 'invite' | 'achievement' | 'reminder' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

const Header = () => {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState('home');
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // 랜덤 환영 메시지 배열
  const welcomeMessages = [
    '오늘도 화이팅! 화이팅',
    '좋은 하루 보내세요!',
    '목표 달성까지 화이팅!',
    '오늘도 열심히!',
    '건강한 하루 되세요!',
    '행복한 하루 보내세요!',
    '오늘도 멋진 하루!',
    '목표를 향해 달려가세요!',
    '오늘도 최고의 하루!',
    '꿈을 향해 한 걸음씩!',
    '오늘도 성장하는 하루!',
    '긍정적인 하루 되세요!',
    '오늘도 도전하는 하루!',
    '희망찬 하루 보내세요!',
    '오늘도 감사한 하루!'
  ];

  // 랜덤 환영 메시지 선택
  useEffect(() => {
    if (session?.user) {
      const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
      setWelcomeMessage(randomMessage);
    }
  }, [session?.user]);

  // 샘플 알람 데이터 (실제로는 API에서 가져올 데이터)
  useEffect(() => {
    const sampleNotifications: Notification[] = [
      {
        id: '1',
        type: 'invite',
        title: '가계부 공유 초대',
        message: '김철수님이 "우리 가족 가계부"에 초대했습니다.',
        timestamp: '2분 전',
        isRead: false,
        actionUrl: '/share-groups'
      },
      {
        id: '2',
        type: 'achievement',
        title: '저축목표 달성! 화이팅',
        message: '여행 자금 목표를 달성했습니다!',
        timestamp: '1시간 전',
        isRead: false,
        actionUrl: '/savings'
      },
      {
        id: '3',
        type: 'reminder',
        title: '정기 납입 알림',
        message: '주택청약 저축 납입일이 다가왔습니다.',
        timestamp: '3시간 전',
        isRead: true,
        actionUrl: '/savings'
      },
      {
        id: '4',
        type: 'system',
        title: '시스템 업데이트',
        message: '새로운 기능이 추가되었습니다.',
        timestamp: '1일 전',
        isRead: true
      }
    ];
    
    setNotifications(sampleNotifications);
    setUnreadCount(sampleNotifications.filter(n => !n.isRead).length);
  }, []);

  // 프로필 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const menuItems = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'expenses', label: 'Expenses', path: '/expenses' },
    { id: 'savings', label: 'Goal', path: '/savings' },
    { id: 'calendar', label: 'Calendar', path: '/calendar' },
    { id: 'statistics', label: 'Statistics' },
  ];

  // URL 경로에 따라 active 메뉴 설정
  useEffect(() => {
    const currentPath = pathname || '/';

    const matched = menuItems
      .filter((item) => !!item.path)
      .sort((a, b) => (b.path!.length - a.path!.length))
      .find((item) => {
        const p = item.path!;
        if (p === '/') {
          return currentPath === '/';
        }
        return currentPath.startsWith(p + '/') || currentPath === p;
      });

    if (matched) {
      setActiveMenu(matched.id);
    } else {
      setActiveMenu('home');
    }
  }, [pathname]);

  const handleClick = (item: { id: string; path?: string }) => {
    setActiveMenu(item.id);
    if (item.path) {
      router.push(item.path);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const handleNotificationClick = (notification: Notification) => {
    // 알람을 읽음 처리
    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // 액션 URL이 있으면 이동
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
    
    setIsNotificationOpen(false);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invite':
        return '👥';
      case 'achievement':
        return '🏆';
      case 'reminder':
        return '⏰';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'invite':
        return '#3B82F6';
      case 'achievement':
        return '#10B981';
      case 'reminder':
        return '#F59E0B';
      case 'system':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <h2>MoneyMate</h2>
          </div>
        </div>
        
        <div className={styles.headerCenter}>
          <nav className={styles.navigation}>
            <ul className={styles.menuList}>
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    className={`${styles.menuItem} ${activeMenu === item.id ? styles.active : ''}`}
                    onClick={() => handleClick(item)}
                  >
                    <span className={styles.label}>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        
        <div className={styles.headerRight}>
          <div className={styles.authSection}>
            {status === 'loading' ? (
              <div style={{ width: '120px', height: '40px' }}></div>
            ) : session?.user ? (
              <>
                {/* 환영 메시지 영역 */}
                <div className={styles.welcomeMessage}>
                  <span className={styles.welcomeText}>
                    {session.user.nickname || session.user.email?.split('@')[0] || '사용자'}님, {welcomeMessage}
                  </span>
                </div>

                {/* 알람 영역 - 주석처리 */}
                {/* 
                <div className={styles.notificationContainer} ref={notificationRef}>
                  <div 
                    className={styles.notificationTextArea}
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  >
                    <span className={styles.notificationText}>
                      {unreadCount > 0 ? (
                        <>
                          <span className={styles.unreadIndicator}>●</span>
                          <span className={styles.notificationCount}>
                            {unreadCount > 9 ? '9+' : unreadCount}개의 새 알림
                          </span>
                        </>
                      ) : (
                        <span className={styles.noNotificationText}>알림</span>
                      )}
                    </span>
                    <span className={`${styles.dropdownArrow} ${isNotificationOpen ? styles.open : ''}`}>
                      ▼
                    </span>
                  </div>
                  
                  <div className={`${styles.notificationDropdown} ${isNotificationOpen ? styles.show : ''}`}>
                    <div className={styles.notificationHeader}>
                      <h3>알림</h3>
                      {unreadCount > 0 && (
                        <button 
                          className={styles.markAllReadButton}
                          onClick={markAllAsRead}
                        >
                          모두 읽음
                        </button>
                      )}
                    </div>
                    
                    <div className={styles.notificationList}>
                      {notifications.length === 0 ? (
                        <div className={styles.emptyNotification}>
                          <span className={styles.emptyIcon}>🔕</span>
                          <p>새로운 알림이 없습니다</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div 
                            key={notification.id}
                            className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div 
                              className={styles.notificationIcon}
                              style={{ backgroundColor: getNotificationColor(notification.type) }}
                            >
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className={styles.notificationContent}>
                              <div className={styles.notificationTitle}>
                                {notification.title}
                              </div>
                              <div className={styles.notificationMessage}>
                                {notification.message}
                              </div>
                              <div className={styles.notificationTime}>
                                {notification.timestamp}
                              </div>
                            </div>
                            {!notification.isRead && (
                              <div className={styles.unreadDot}></div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    
                    {notifications.length > 0 && (
                      <div className={styles.notificationFooter}>
                        <button 
                          className={styles.viewAllButton}
                          onClick={() => {
                            router.push('/notifications');
                            setIsNotificationOpen(false);
                          }}
                        >
                          모든 알림 보기
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                */}

                {/* 프로필 영역 */}
                <div className={styles.profileContainer} ref={profileRef}>
                  <button 
                    className={styles.profileButton}
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                  >
                    <div className={styles.profileImage}>
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt="Profile"
                          width={32}
                          height={32}
                        />
                      ) : (
                        <div className={styles.defaultProfile}>
                          {(session.user.nickname || session.user.email || '').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </button>
                  
                  <div className={`${styles.dropdownMenu} ${isProfileOpen ? styles.show : ''}`}>
                    <div className={styles.dropdownHeader}>
                      <strong>{session.user.nickname || session.user.email}</strong>
                      <span>{session.user.email}</span>
                    </div>
                    <div className={styles.dropdownDivider} />
                    <button className={styles.dropdownItem} onClick={() => router.push('/profile')}>
                      계정 관리
                    </button>
                    <button className={styles.dropdownItem}>
                      비밀번호 변경
                    </button>
                    <button className={styles.dropdownItem}>
                      활동 기록
                    </button>
                    <div className={styles.dropdownDivider} />
                    <button className={styles.dropdownItem} onClick={() => router.push('/wallets')}>
                      지갑 관리
                    </button>
                    <button className={styles.dropdownItem} onClick={() => router.push('/share-groups')}>
                      가계부 공유
                    </button>
                    <div className={styles.dropdownDivider} />
                    <button className={styles.dropdownItem} onClick={handleLogout}>
                      로그아웃
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <button 
                  className={styles.loginButton}
                  onClick={() => router.push('/login')}
                >
                  로그인
                </button>
                <button 
                  className={styles.signupButton}
                  onClick={() => router.push('/signup')}
                >
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;