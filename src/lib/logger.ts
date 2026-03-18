import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAppStore } from '../store/useAppStore';

export type LogActionType = 'search_vin' | 'search_manual' | 'activate_promo';

export interface UserLog {
  userId: string;
  action: LogActionType;
  details: string;
  timestamp: any;
}

export const logUserAction = async (action: LogActionType, details: string) => {
  const userProfile = useAppStore.getState().userProfile;
  if (!userProfile) return; // Only log for authenticated users

  try {
    await addDoc(collection(db, 'user_logs'), {
      userId: userProfile.uid,
      action,
      details,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to log user action:', error);
  }
};
