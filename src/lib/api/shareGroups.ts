import { get, post } from './common';

export interface ShareGroup {
  grp_id: string;
  grp_name: string;
  owner_usr_id: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  user_role: 'OWNER' | 'PARTNER';
}

export interface ShareGroupMember {
  grp_id: string;
  usr_id: string;
  role: 'OWNER' | 'PARTNER';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  invited_at: string;
  accepted_at?: string;
}

export interface ShareGroupInvitation {
  grp_id: string;
  usr_id: string;
  role: 'OWNER' | 'PARTNER';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  invited_at: string;
  accepted_at?: string;
  grp_name: string;
  owner_usr_id: string;
  owner_usr_nickname: string;
  member_count: number;
}

export interface ShareGroupCreateRequest {
  grp_name: string;
  owner_usr_id: string;
}

export interface ShareGroupInviteRequest {
  grp_id: string;
  invited_usr_id: string;
  inviter_usr_id: string;
  role?: 'OWNER' | 'PARTNER';
}

export interface ShareGroupInviteResponseRequest {
  grp_id: string;
  usr_id: string;
  response: 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
}

/**
 * 사용자가 속한 공유 그룹 목록 조회
 * @param usr_id 사용자 ID
 * @returns Promise<ShareGroup[]>
 */
export async function getShareGroups(usr_id: string): Promise<ShareGroup[]> {
  const response = await get<{ success: boolean; data: ShareGroup[] }>('/share-groups', {
    params: { usr_id }
  });
  return response.data.data || [];
}

/**
 * 사용자가 받은 초대 목록 조회
 * @param usr_id 사용자 ID
 * @returns Promise<ShareGroupInvitation[]>
 */
export async function getShareGroupInvitations(usr_id: string): Promise<ShareGroupInvitation[]> {
  const response = await get<{ success: boolean; data: ShareGroupInvitation[] }>('/share-groups/invitations', {
    params: { usr_id }
  });
  return response.data.data || [];
}

/**
 * 새로운 공유 그룹 생성
 * @param data 공유 그룹 생성 데이터
 * @returns Promise<{ grp_id: string }>
 */
export async function createShareGroup(data: ShareGroupCreateRequest): Promise<{ grp_id: string }> {
  const response = await post<{ success: boolean; message: string; data: { grp_id: string } }>('/share-groups', data);
  return response.data.data;
}

/**
 * 공유 그룹에 사용자 초대
 * @param data 초대 데이터
 * @returns Promise<void>
 */
export async function inviteToShareGroup(data: ShareGroupInviteRequest): Promise<void> {
  await post<{ success: boolean; message: string }>('/share-groups/invite', data);
}

/**
 * 공유 그룹 초대에 응답
 * @param data 응답 데이터
 * @returns Promise<void>
 */
export async function respondToShareGroupInvite(data: ShareGroupInviteResponseRequest): Promise<void> {
  await post<{ success: boolean; message: string }>('/share-groups/invite/respond', data);
} 