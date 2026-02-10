
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './pages/components/Navbar';
import Marketplace from './pages/Marketplace';
import EventDetails from './pages/EventDetails';
import OwnerDashboard from './pages/OwnerDashboard';
import PhotographerDashboard from './pages/PhotographerDashboard';
import CreateEvent from './pages/CreateEvent';
import ManageEvent from './pages/ManageEvent';
import LandingPage from './pages/LandingPage';
import PhotographerProfile from './pages/PhotographerProfile';
import DevDashboard from './pages/DevDashboard';
import Auth from './pages/Auth';
import Toast, { NotificationType } from './components/Toast';
import { User, UserRole, Event, Bid, PhotoPackageType } from './types';
import { supabase } from './services/supabase';
import { uploadToWasabi, getPresignedUrl } from './services/wasabi';
import { Loader } from 'lucide-react';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedPhotographerId, setSelectedPhotographerId] = useState<string | null>(null);
  const [authProps, setAuthProps] = useState<{ mode: 'login' | 'signup', role: UserRole } | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [localPotentialQueue, setLocalPotentialQueue] = useState<Partial<Event>[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentPageRef = useRef(currentPage);
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  const showNotification = useCallback((message: string, type: NotificationType = 'SUCCESS') => {
    setNotification({ message, type });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`*, job_roles (*), submissions (*)`)
        .order('event_date', { ascending: false });
      
      if (eventsError) throw eventsError;
      
      const processedEvents = (eventsData || []).map((e: any) => ({
        ...e,
        roles: e.job_roles ?? [],
        imageUrl: e.image_url, 
        ownerId: e.owner_id,
        packageType: e.package_type ?? PhotoPackageType.BASIC,
        photoLimit: e.photo_limit ?? 100,
        date: e.event_date,
        endDate: e.end_date,
        isAllDay: !!e.is_all_day,
        isOpenShoot: !!e.is_open_shoot,
        openShootApprovalRequired: e.open_shoot_approval_required === false ? false : true,
        submissions: (e.submissions || []).map((s: any) => ({
          ...s,
          photographerId: s.photographer_id,
          submittedAt: s.submitted_at
        })),
        sourceUrls: [] 
      }));

      setEvents(processedEvents);

      // Async presigning background update (non-blocking)
      processedEvents.forEach(async (ev) => {
        if (ev.imageUrl && !ev.imageUrl.startsWith('http') && !ev.imageUrl.startsWith('data:')) {
          try {
            const presigned = await getPresignedUrl(ev.imageUrl);
            setEvents(prev => prev.map(item => item.id === ev.id ? { ...item, imageUrl: presigned } : item));
          } catch (err) {
            console.warn("Banner presign fail:", ev.id);
          }
        }
      });

      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select('*, photographer:profiles!photographer_id(name)')
        .order('submitted_at', { ascending: false });
      
      if (bidsError) throw bidsError;
      
      setBids((bidsData || []).map((b: any) => ({
        ...b,
        eventId: b.event_id,
        eventOwnerId: b.event_owner_id,
        roleId: b.role_id,
        photographerId: b.photographer_id,
        photographerName: b.photographer?.name || 'Photographer',
        submittedAt: b.submitted_at,
        status: (b.status || 'PENDING').toUpperCase()
      })));
    } catch (err) {
      console.error('fetchData failed:', err);
    }
  }, []);

  const syncUserProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error || !profile) return null;
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role as UserRole,
        avatarUrl: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}`,
        bio: profile.bio,
        website: profile.website,
        instagram: profile.instagram,
        city: profile.city,
        state: profile.state,
        joinedDate: profile.joined_date,
        skills: profile.skills || [],
        targetRole: profile.target_role,
        careerGoals: profile.career_goals,
        portfolioGaps: profile.portfolio_gaps || []
      } as User;
    } catch (err) {
      return null;
    }
  }, []);

  // Initialization & Auth Listener
  useEffect(() => {
    let mounted = true;

    // Safety timeout: Ensure the loading screen is cleared after 10 seconds no matter what
    const safetyTimeout = setTimeout(() => {
      if (mounted && isInitialLoading) {
        console.warn("Safety timeout triggered: Forcing initial loading to false.");
        setIsInitialLoading(false);
      }
    }, 10000);

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          const user = await syncUserProfile(session.user.id);
          if (user && mounted) {
            setCurrentUser(user);
            await fetchData();
            if (currentPageRef.current === 'home' || currentPageRef.current === 'auth') {
              setCurrentPage(user.role === UserRole.DEV ? 'dev-dashboard' : 'dashboard');
            }
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        if (mounted) {
          setIsInitialLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setCurrentPage('home');
      } else if (session?.user) {
        const user = await syncUserProfile(session.user.id);
        if (user && mounted) {
          setCurrentUser(user);
          await fetchData();
          if (currentPageRef.current === 'auth' || currentPageRef.current === 'home') {
            setCurrentPage(user.role === UserRole.DEV ? 'dev-dashboard' : 'dashboard');
          }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [fetchData, syncUserProfile]);

  const toggleBookmark = useCallback((eventId: string) => {
    setBookmarks(prev => {
      const isBookmarked = prev.includes(eventId);
      if (isBookmarked) {
        showNotification("Event removed from schedule.", "INFO");
        return prev.filter(id => id !== eventId);
      } else {
        showNotification("Event added to schedule.", "SUCCESS");
        return [...prev, eventId];
      }
    });
  }, [showNotification]);

  const handleApproveEvent = async (eventToApprove: Partial<Event>) => {
    if (!currentUser) return;
    setIsTransitioning(true);
    try {
      let finalImageUrl = eventToApprove.imageUrl || '';
      
      if (finalImageUrl.startsWith('data:')) {
        try {
          const byteString = atob(finalImageUrl.split(',')[1]);
          const mimeString = finalImageUrl.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
          const file = new File([ab], `asset_${Date.now()}.png`, { type: mimeString });
          finalImageUrl = await uploadToWasabi(file, 'system', currentUser.id, 'ai_ingest');
        } catch (uploadErr) {
          console.warn("Asset upload failed", uploadErr);
        }
      }

      const dbData = {
        owner_id: currentUser.id,
        title: eventToApprove.title,
        description: eventToApprove.description,
        event_date: eventToApprove.date,
        end_date: eventToApprove.endDate || null,
        is_all_day: !!eventToApprove.isAllDay,
        location: eventToApprove.location,
        image_url: finalImageUrl,
        is_open_shoot: true,
        open_shoot_approval_required: false,
        status: 'OPEN',
        package_type: PhotoPackageType.BASIC,
        photo_limit: 200
      };

      if (eventToApprove.id && !eventToApprove.id.startsWith('local-')) {
        const { error } = await supabase.from('events').update(dbData).eq('id', eventToApprove.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('events').insert(dbData);
        if (error) throw error;
      }

      setLocalPotentialQueue(prev => prev.filter(e => e.title !== eventToApprove.title));
      showNotification("Event is now live.");
      await fetchData();
    } catch (err: any) {
      console.error("Publishing Error:", err);
      showNotification(err.message || "Failed to sync with database.", "ERROR");
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleRejectEvent = async (eventToReject: Partial<Event>) => {
    setIsTransitioning(true);
    try {
      if (eventToReject.id && !eventToReject.id.startsWith('local-')) {
        const { error } = await supabase.from('events').delete().eq('id', eventToReject.id);
        if (error) throw error;
      }
      setLocalPotentialQueue(prev => prev.filter(e => e.title !== eventToReject.title));
      showNotification("Record discarded.", "INFO");
      await fetchData();
    } catch (err: any) {
      showNotification("Rejection failed.", "ERROR");
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleBid = async (eventId: string, roleId: string | undefined, amount: number, message: string, type: 'PAID' | 'OPEN_SHOOT') => {
    if (!currentUser) return;
    try {
      const { error } = await supabase.from('bids').insert({
        event_id: eventId,
        role_id: roleId,
        photographer_id: currentUser.id,
        amount,
        message,
        type,
        status: 'PENDING'
      });
      if (error) throw error;
      showNotification("Proposal sent successfully.");
      await fetchData();
    } catch (err) {
      showNotification("Failed to submit proposal.", "ERROR");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleAuthNavigation = (mode: 'login' | 'signup', role: UserRole = UserRole.PHOTOGRAPHER) => {
    setAuthProps({ mode, role });
    setCurrentPage('auth');
  };

  const renderPage = () => {
    if (isInitialLoading) return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="flex flex-col items-center">
          <Loader className="w-12 h-12 text-gold animate-spin mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-espresso/40">Synchronizing Visual Hub...</p>
        </div>
      </div>
    );

    if (currentPage === 'auth' && authProps) {
      return (
        <Auth 
          initialMode={authProps.mode} 
          initialRole={authProps.role} 
          onBack={() => setCurrentPage('home')} 
          onSuccess={() => fetchData()} 
        />
      );
    }

    if (!currentUser && currentPage === 'home') {
      return (
        <LandingPage onGetStarted={(role, mode) => handleAuthNavigation(mode, role)} />
      );
    }

    const selectedEvent = events.find(e => e.id === selectedEventId);
    const selectedPhotographer = selectedPhotographerId ? { id: selectedPhotographerId, name: 'Photographer', email: '', role: UserRole.PHOTOGRAPHER, avatarUrl: '', skills: [] } as User : null;

    switch (currentPage) {
      case 'marketplace':
        return (
          <Marketplace 
            events={events.filter(e => e.status === 'OPEN')} 
            bookmarks={bookmarks} 
            onToggleBookmark={toggleBookmark} 
            onEventClick={(e) => { setSelectedEventId(e.id); setCurrentPage('event-details'); }}
            user={currentUser!}
          />
        );
      case 'event-details':
        return selectedEvent ? (
          <EventDetails 
            event={selectedEvent} 
            user={currentUser!} 
            onBack={() => setCurrentPage('marketplace')} 
            onPlaceBid={handleBid}
            isBookmarked={bookmarks.includes(selectedEvent.id)}
            onToggleBookmark={() => toggleBookmark(selectedEvent.id)}
          />
        ) : null;
      case 'dashboard':
        if (currentUser?.role === UserRole.EVENT_OWNER) {
          return (
            <OwnerDashboard 
              events={events} 
              bids={bids} 
              user={currentUser} 
              onCreateEvent={() => setCurrentPage('create-event')}
              onEventClick={(e) => { setSelectedEventId(e.id); setCurrentPage('manage-event'); }}
              onBidUpdate={async (id, action) => {
                 await supabase.from('bids').update({ status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED' }).eq('id', id);
                 fetchData();
              }}
              onPhotographerClick={(id) => { setSelectedPhotographerId(id); setCurrentPage('photographer-profile'); }}
              onNotify={showNotification}
              onUpdateStorage={async (id, limit, pkg) => {
                 await supabase.from('events').update({ photo_limit: limit, package_type: pkg }).eq('id', id);
                 fetchData();
              }}
              onDeletePhoto={async (eventId, photoId) => {
                 await supabase.from('submissions').delete().eq('id', photoId);
                 fetchData();
              }}
            />
          );
        }
        return (
          <PhotographerDashboard 
            events={events} 
            bids={bids} 
            bookmarks={bookmarks} 
            user={currentUser!} 
            onUploadPhoto={() => {}} 
            onEventClick={(e) => { setSelectedEventId(e.id); setCurrentPage('event-details'); }}
            onBidUpdate={() => {}}
            onToggleBookmark={toggleBookmark}
          />
        );
      case 'create-event':
        return <CreateEvent onBack={() => setCurrentPage('dashboard')} onSave={async (data) => {
          setIsTransitioning(true);
          try {
            const { data: newEvent, error: eventError } = await supabase
              .from('events')
              .insert({
                owner_id: currentUser!.id,
                title: data.title,
                description: data.description,
                event_date: data.date,
                end_date: data.endDate,
                is_all_day: data.isAllDay,
                location: data.location,
                image_url: data.imageUrl,
                is_open_shoot: data.isOpenShoot,
                open_shoot_approval_required: data.openShootApprovalRequired,
                package_type: data.packageType,
                photo_limit: data.photoLimit,
                status: 'OPEN'
              })
              .select()
              .single();

            if (eventError) throw eventError;

            if (data.roles.length > 0) {
              const { error: rolesError } = await supabase.from('job_roles').insert(
                data.roles.map(r => ({
                  event_id: newEvent.id,
                  title: r.title,
                  description: r.description,
                  min_budget: r.minBudget,
                  max_budget: r.maxBudget
                }))
              );
              if (rolesError) throw rolesError;
            }

            showNotification("Event published.");
            await fetchData();
            setCurrentPage('dashboard');
          } catch (err) {
            showNotification("Creation failed.", "ERROR");
          } finally {
            setIsTransitioning(false);
          }
        }} />;
      case 'manage-event':
        return selectedEvent ? (
          <ManageEvent 
            event={selectedEvent} 
            bids={bids} 
            onBack={() => setCurrentPage('dashboard')} 
            onUpdate={async (updated) => {
              setIsTransitioning(true);
              try {
                await supabase.from('events').update({ 
                  title: updated.title, 
                  description: updated.description,
                  event_date: updated.date,
                  end_date: updated.endDate,
                  location: updated.location,
                  image_url: updated.imageUrl,
                  is_open_shoot: updated.isOpenShoot,
                  open_shoot_approval_required: updated.openShootApprovalRequired
                }).eq('id', updated.id);
                await fetchData();
                setCurrentPage('dashboard');
              } catch (err) {
                showNotification("Update failed.", "ERROR");
              } finally {
                setIsTransitioning(false);
              }
            }}
            onReschedule={() => {}}
          />
        ) : null;
      case 'dev-dashboard':
        return (
          <DevDashboard 
            events={events} 
            localPotentialQueue={localPotentialQueue} 
            onApprove={handleApproveEvent} 
            onReject={handleRejectEvent} 
            onIngest={(newList) => setLocalPotentialQueue(newList)}
            onAdminDelete={async (id) => { 
              setIsTransitioning(true);
              try {
                await supabase.from('events').delete().eq('id', id); 
                await fetchData(); 
              } finally {
                setIsTransitioning(false);
              }
            }}
            onAdminUpdate={async (e) => { 
              setIsTransitioning(true);
              try {
                await supabase.from('events').update(e).eq('id', e.id); 
                await fetchData(); 
              } finally {
                setIsTransitioning(false);
              }
            }}
            user={currentUser!}
          />
        );
      case 'my-profile':
      case 'photographer-profile':
        return (
          <PhotographerProfile 
            photographer={selectedPhotographer || currentUser!} 
            events={events} 
            onBack={() => setCurrentPage(currentUser?.role === UserRole.DEV ? 'dev-dashboard' : 'dashboard')} 
            isEditable={currentPage === 'my-profile'}
            onSave={async (data) => {
              setIsTransitioning(true);
              try {
                await supabase.from('profiles').update(data).eq('id', currentUser?.id);
                const updated = await syncUserProfile(currentUser!.id);
                if (updated) setCurrentUser(updated);
                showNotification("Profile synced.");
              } finally {
                setIsTransitioning(false);
              }
            }}
            onEventClick={(e) => { setSelectedEventId(e.id); setCurrentPage('event-details'); }}
          />
        );
      default:
        return <LandingPage onGetStarted={(role, mode) => handleAuthNavigation(mode, role)} />;
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      {currentPage !== 'auth' && (
        <Navbar 
          currentUser={currentUser} 
          currentPage={currentPage} 
          onLogout={handleLogout} 
          onNavigate={setCurrentPage} 
          onLogin={() => handleAuthNavigation('login')}
          onSignUp={() => handleAuthNavigation('signup')}
          onToggleRole={async () => {
            setIsTransitioning(true);
            try {
              const newRole = currentUser?.role === UserRole.PHOTOGRAPHER ? UserRole.EVENT_OWNER : UserRole.PHOTOGRAPHER;
              await supabase.from('profiles').update({ role: newRole }).eq('id', currentUser?.id);
              const updated = await syncUserProfile(currentUser!.id);
              if (updated) {
                setCurrentUser(updated);
                setCurrentPage('dashboard');
              }
            } finally {
              setIsTransitioning(false);
            }
          }}
        />
      )}
      {renderPage()}
      {isTransitioning && (
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
          <Loader className="w-10 h-10 text-gold animate-spin" />
        </div>
      )}
    </div>
  );
};

export default App;
