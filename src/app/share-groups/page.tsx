'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import layoutStyles from '../../styles/css/page.module.css';
import styles from '../../styles/css/share-groups.module.css';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import {
  ShareGroup,
  ShareGroupInvitation,
  getShareGroups,
  getShareGroupInvitations,
  createShareGroup,
  inviteToShareGroup,
  respondToShareGroupInvite,
  ShareGroupCreateRequest,
  ShareGroupInviteRequest,
  ShareGroupInviteResponseRequest
} from '@/lib/api/shareGroups';
import {
  Wallet,
  getWallets,
  updateWallet,
  WalletUpdateRequest
} from '@/lib/api/wallets';

interface CreateModalState {
  isOpen: boolean;
  groupName: string;
}

interface InviteModalState {
  isOpen: boolean;
  selectedGroup: ShareGroup | null;
  inviteEmail: string;
}

interface WalletShareModalState {
  isOpen: boolean;
  wallets: Wallet[];
  loading: boolean;
}

export default function ShareGroupsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [shareGroups, setShareGroups] = useState<ShareGroup[]>([]);
  const [invitations, setInvitations] = useState<ShareGroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [createModal, setCreateModal] = useState<CreateModalState>({
    isOpen: false,
    groupName: ''
  });
  
  const [inviteModal, setInviteModal] = useState<InviteModalState>({
    isOpen: false,
    selectedGroup: null,
    inviteEmail: ''
  });

  const [walletShareModal, setWalletShareModal] = useState<WalletShareModalState>({
    isOpen: false,
    wallets: [],
    loading: false
  });

  // 공유 그룹 목록 조회
  const fetchShareGroups = async () => {
    if (!session?.user?.id) return;

    try {
      const groups = await getShareGroups(session.user.id);
      setShareGroups(groups);
      setError(null);
    } catch (error) {
      console.error('공유 그룹 조회 오류:', error);
      setError('공유 그룹 목록을 불러오는데 실패했습니다.');
    }
  };

  // 초대 목록 조회
  const fetchInvitations = async () => {
    if (!session?.user?.id) return;

    try {
      const invites = await getShareGroupInvitations(session.user.id);
      setInvitations(invites);
    } catch (error) {
      console.error('초대 목록 조회 오류:', error);
    }
  };

  // 지갑 목록 조회
  const fetchWallets = async () => {
    if (!session?.user?.id) return;

    try {
      setWalletShareModal(prev => ({ ...prev, loading: true }));
      const wallets = await getWallets(session.user.id);
      setWalletShareModal(prev => ({ ...prev, wallets, loading: false }));
    } catch (error) {
      console.error('지갑 목록 조회 오류:', error);
      setWalletShareModal(prev => ({ ...prev, loading: false }));
      alert('지갑 목록을 불러오는데 실패했습니다.');
    }
  };

  // 지갑 공유 설정 변경
  const handleWalletShareChange = async (wallet: Wallet, shareYn: string) => {
    if (!session?.user?.id) return;

    try {
      const updateData: WalletUpdateRequest = {
        usr_id: session.user.id,
        wlt_type: wallet.wlt_type,
        wlt_name: wallet.wlt_name,
        bank_cd: wallet.bank_cd,
        is_default: wallet.is_default,
        share_yn: shareYn
      };

      await updateWallet(wallet.wlt_id, updateData);

      // 로컬 상태 업데이트
      setWalletShareModal(prev => ({
        ...prev,
        wallets: prev.wallets.map(w => 
          w.wlt_id === wallet.wlt_id ? { ...w, share_yn: shareYn } : w
        )
      }));

      const message = shareYn === 'Y' ? '지갑이 공유 설정되었습니다.' : '지갑 공유가 해제되었습니다.';
      alert(message);
    } catch (error) {
      console.error('지갑 공유 설정 오류:', error);
      alert('지갑 공유 설정에 실패했습니다.');
    }
  };

  // 지갑 공유 모달 열기
  const handleOpenWalletShareModal = () => {
    setWalletShareModal({ isOpen: true, wallets: [], loading: false });
    fetchWallets();
  };

  // 데이터 로드
  const loadData = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      await Promise.all([fetchShareGroups(), fetchInvitations()]);
    } finally {
      setLoading(false);
    }
  };

  // 공유 그룹 생성
  const handleCreateGroup = async () => {
    if (!session?.user?.id || !createModal.groupName.trim()) return;

    try {
      const createData: ShareGroupCreateRequest = {
        grp_name: createModal.groupName.trim(),
        owner_usr_id: session.user.id
      };

      await createShareGroup(createData);
      
      // 모달 닫기 및 목록 새로고침
      setCreateModal({ isOpen: false, groupName: '' });
      loadData();
      
      alert('공유 그룹이 생성되었습니다.');
    } catch (error) {
      console.error('공유 그룹 생성 오류:', error);
      alert('공유 그룹 생성에 실패했습니다.');
    }
  };

  // 사용자 초대
  const handleInviteUser = async () => {
    if (!session?.user?.id || !inviteModal.selectedGroup || !inviteModal.inviteEmail.trim()) return;

    try {
      // 이메일로 사용자 ID를 찾는 로직이 필요하지만, 
      // 현재는 이메일을 사용자 ID로 간주
      const inviteData: ShareGroupInviteRequest = {
        grp_id: inviteModal.selectedGroup.grp_id,
        invited_usr_id: inviteModal.inviteEmail.trim(), // 실제로는 사용자 ID 조회 필요
        inviter_usr_id: session.user.id,
        role: 'PARTNER'
      };

      await inviteToShareGroup(inviteData);
      
      // 모달 닫기
      setInviteModal({ isOpen: false, selectedGroup: null, inviteEmail: '' });
      
      alert('초대가 완료되었습니다.');
    } catch (error) {
      console.error('사용자 초대 오류:', error);
      alert('사용자 초대에 실패했습니다.');
    }
  };

  // 초대 응답 처리
  const handleInvitationResponse = async (invitation: ShareGroupInvitation, response: 'ACCEPTED' | 'REJECTED') => {
    if (!session?.user?.id) return;

    try {
      const responseData: ShareGroupInviteResponseRequest = {
        grp_id: invitation.grp_id,
        usr_id: session.user.id,
        response
      };

      await respondToShareGroupInvite(responseData);
      
      // 데이터 새로고침
      loadData();
      
      const message = response === 'ACCEPTED' ? '초대를 수락했습니다.' : '초대를 거절했습니다.';
      alert(message);
    } catch (error) {
      console.error('초대 응답 오류:', error);
      alert('초대 응답에 실패했습니다.');
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  useEffect(() => {
    if (session?.user?.id) {
      loadData();
    }
  }, [session?.user?.id]);

  // 비로그인 상태 처리
  if (status === 'unauthenticated') {
    return <LoginRequiredModal />;
  }

  // 로딩 중 처리
  if (status === 'loading') {
    return null;
  }

  return (
    <div className={layoutStyles.dashboard}>
      <main className={layoutStyles.dashboardBody}>
        <div className={styles.shareGroupsPage}>
          <div className="container">
            <header className={styles.header}>
              <div className={styles.headerTop}>
                <div className={styles.headerLeft}>
                  <h1 className={styles.title}>가계부 공유</h1>
                  <p className={styles.subtitle}>가족이나 친구와 가계부를 공유하여 함께 관리하세요.</p>
                </div>
                <div className={styles.headerRight}>
                  <button 
                    className={styles.buttonSecondary}
                    onClick={handleOpenWalletShareModal}
                  >
                    💳 지갑 공유 설정
                  </button>
                  &nbsp;
                  <button 
                    className={styles.buttonPrimary}
                    onClick={() => setCreateModal({ isOpen: true, groupName: '' })}
                  >
                    + 공유 그룹 만들기
                  </button>
                </div>
              </div>
            </header>

            {/* 초대 알림 영역 */}
            {invitations.length > 0 && (
              <section className={styles.invitationsSection}>
                <div className={styles.invitationAlert}>
                  <div className={styles.invitationHeader}>
                    <div className={styles.invitationIcon}>📬</div>
                    <div className={styles.invitationContent}>
                      <h3 className={styles.invitationTitle}>
                        새로운 초대 {invitations.length}개
                      </h3>
                      <p className={styles.invitationSubtitle}>
                        가계부 공유 그룹 초대를 받았습니다.
                      </p>
                    </div>
                  </div>
                  
                  <div className={styles.invitationsList}>
                    {invitations.map((invitation) => (
                      <div key={`${invitation.grp_id}-${invitation.usr_id}`} className={styles.invitationItem}>
                        <div className={styles.invitationInfo}>
                          <div className={styles.invitationGroupName}>
                            <strong>{invitation.grp_name}</strong>
                          </div>
                          <div className={styles.invitationMeta}>
                            <span className={styles.memberCount}>👥 {invitation.member_count}명</span>
                            <span className={styles.inviterInfo}>
                              {invitation.owner_usr_nickname}님이 초대
                            </span>
                            <span className={styles.invitedDate}>
                              초대일: {formatDate(invitation.invited_at)}
                            </span>
                          </div>
                        </div>
                        <div className={styles.invitationActions}>
                          <button 
                            className={styles.acceptButton}
                            onClick={() => handleInvitationResponse(invitation, 'ACCEPTED')}
                          >
                            수락
                          </button>
                          <button 
                            className={styles.rejectButton}
                            onClick={() => handleInvitationResponse(invitation, 'REJECTED')}
                          >
                            거절
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            {loading ? (
              <div className={styles.loadingMessage}>
                공유 그룹 목록을 불러오는 중...
              </div>
            ) : shareGroups.length === 0 ? (
              <div className={styles.emptyMessage}>
                <div className={styles.emptyIcon}>👥</div>
                <h3>공유 그룹이 없습니다</h3>
                <p>첫 번째 공유 그룹을 만들어 가족이나 친구와 가계부를 공유해보세요!</p>
                <button 
                  className={styles.buttonPrimary}
                  onClick={() => setCreateModal({ isOpen: true, groupName: '' })}
                >
                  공유 그룹 만들기
                </button>
              </div>
            ) : (
              <section className={styles.groupsSection}>
                <h2 className={styles.sectionTitle}>내 공유 그룹 ({shareGroups.length}개)</h2>
                <div className={styles.groupsList}>
                  {shareGroups.map((group) => (
                    <div key={group.grp_id} className={styles.groupCard}>
                      <div className={styles.groupHeader}>
                        <div className={styles.groupInfo}>
                          <h3 className={styles.groupName}>{group.grp_name}</h3>
                          <div className={styles.groupMeta}>
                            <span className={styles.memberCount}>👥 {group.member_count}명</span>
                            <span className={styles.createdDate}>생성일: {formatDate(group.created_at)}</span>
                          </div>
                        </div>
                        <div className={styles.groupStatus}>
                          {group.user_role === 'OWNER' && (
                            <span className={styles.ownerBadge}>소유자</span>
                          )}
                          {group.user_role === 'PARTNER' && (
                            <span className={styles.partnerBadge}>멤버</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.groupActions}>
                        {group.user_role === 'OWNER' && (
                          <>
                            <button 
                              className={styles.buttonSecondary}
                              onClick={() => setInviteModal({ 
                                isOpen: true, 
                                selectedGroup: group, 
                                inviteEmail: '' 
                              })}
                            >
                              멤버 초대
                            </button>
                            <button className={styles.buttonGhost}>
                              멤버 관리
                            </button>
                            <button className={styles.buttonGhost}>
                              설정
                            </button>
                          </>
                        )}
                        {group.user_role === 'PARTNER' && (
                          <button className={styles.buttonGhost}>
                            그룹 나가기
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* 그룹 생성 모달 */}
      {createModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalPanel}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>새 공유 그룹 만들기</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setCreateModal({ isOpen: false, groupName: '' })}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label className={styles.label}>그룹 이름</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="예: 우리 가족 가계부"
                  value={createModal.groupName}
                  onChange={(e) => setCreateModal(prev => ({ ...prev, groupName: e.target.value }))}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.buttonGhost}
                onClick={() => setCreateModal({ isOpen: false, groupName: '' })}
              >
                취소
              </button>
              <button 
                className={styles.buttonPrimary}
                onClick={handleCreateGroup}
                disabled={!createModal.groupName.trim()}
              >
                만들기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 사용자 초대 모달 */}
      {inviteModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalPanel}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>멤버 초대</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setInviteModal({ isOpen: false, selectedGroup: null, inviteEmail: '' })}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label className={styles.label}>그룹명</label>
                <div className={styles.groupNameDisplay}>{inviteModal.selectedGroup?.grp_name}</div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>초대할 사용자 이메일</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="user@example.com"
                  value={inviteModal.inviteEmail}
                  onChange={(e) => setInviteModal(prev => ({ ...prev, inviteEmail: e.target.value }))}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.buttonGhost}
                onClick={() => setInviteModal({ isOpen: false, selectedGroup: null, inviteEmail: '' })}
              >
                취소
              </button>
              <button 
                className={styles.buttonPrimary}
                onClick={handleInviteUser}
                disabled={!inviteModal.inviteEmail.trim()}
              >
                초대하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 지갑 공유 설정 모달 */}
      {walletShareModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalPanel}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>💳 지갑 공유 설정</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setWalletShareModal({ isOpen: false, wallets: [], loading: false })}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.walletShareDescription}>
                <p>공유할 지갑을 선택하세요. 공유된 지갑은 가계부 공유 그룹의 모든 멤버가 볼 수 있습니다.</p>
              </div>
              
              {walletShareModal.loading ? (
                <div className={styles.loadingMessage}>
                  지갑 목록을 불러오는 중...
                </div>
              ) : walletShareModal.wallets.length === 0 ? (
                <div className={styles.emptyMessage}>
                  <p>등록된 지갑이 없습니다.</p>
                </div>
              ) : (
                <div className={styles.walletsList}>
                  {walletShareModal.wallets.map((wallet) => (
                    <div key={wallet.wlt_id} className={styles.walletItem}>
                      <div className={styles.walletInfo}>
                        <div className={styles.walletName}>
                          <strong>{wallet.wlt_name}</strong>
                          {wallet.is_default === 'Y' && (
                            <span className={styles.defaultBadge}>기본</span>
                          )}
                        </div>
                        <div className={styles.walletType}>
                          {wallet.wlt_type === 'CASH' && '💵 현금'}
                          {wallet.wlt_type === 'CHECK_CARD' && '💳 체크카드'}
                          {wallet.wlt_type === 'CREDIT_CARD' && '💳 신용카드'}
                        </div>
                      </div>
                      <div className={styles.walletShareOptions}>
                        <label className={styles.radioLabel}>
                          <input
                            type="radio"
                            name={`wallet_${wallet.wlt_id}`}
                            value="Y"
                            checked={wallet.share_yn === 'Y'}
                            onChange={() => handleWalletShareChange(wallet, 'Y')}
                          />
                          <span className={styles.radioText}>공유</span>
                        </label>
                        <label className={styles.radioLabel}>
                          <input
                            type="radio"
                            name={`wallet_${wallet.wlt_id}`}
                            value="N"
                            checked={wallet.share_yn === 'N'}
                            onChange={() => handleWalletShareChange(wallet, 'N')}
                          />
                          <span className={styles.radioText}>비공유</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.buttonPrimary}
                onClick={() => setWalletShareModal({ isOpen: false, wallets: [], loading: false })}
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 