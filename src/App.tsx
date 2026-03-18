/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import Result from './pages/Result';
import Favorites from './pages/Favorites';
import History from './pages/History';
import Dashboard from './pages/Dashboard';
import { useAppStore } from './store/useAppStore';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from './types';

export default function App() {
  const { setUserProfile, setAuthReady, userProfile } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.add('dark');

    let unsubscribeDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = undefined;
      }

      if (user) {
        unsubscribeDoc = onSnapshot(doc(db, 'users', user.uid), (userDoc) => {
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            setUserProfile(profile);
            // Sync active promo code from profile if it exists
            if (profile.activePromoCode !== undefined) {
              useAppStore.getState().setActivePromoCode(profile.activePromoCode);
            }
          } else {
            setUserProfile(null);
          }
          setAuthReady(true);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
          setAuthReady(true);
        });
      } else {
        setUserProfile(null);
        setAuthReady(true);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, [setUserProfile, setAuthReady]);

  const isStaff = userProfile?.role === 'admin' || 
                  userProfile?.role === 'moderator' || 
                  userProfile?.email?.toLowerCase() === 'minerpc2002@gmail.com';

  return (
    <BrowserRouter>
      <div className="bg-blobs">
        <div className="blob w-[800px] h-[800px] bg-blue-600/50 -top-[10%] -left-[10%]" />
        <div className="blob w-[900px] h-[900px] bg-indigo-500/40 -bottom-[10%] -right-[10%] animation-delay-2000" />
        <div className="blob w-[600px] h-[600px] bg-fuchsia-500/40 top-[20%] right-[10%] animation-delay-4000" />
        <div className="blob w-[700px] h-[700px] bg-cyan-500/30 bottom-[20%] left-[10%] animation-delay-3000" />
      </div>
      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="search" element={<Search />} />
            <Route path="result/:id" element={<Result />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="history" element={<History />} />
            <Route 
              path="dashboard" 
              element={isStaff ? <Dashboard /> : <Navigate to="/" replace />} 
            />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}
