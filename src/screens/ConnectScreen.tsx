import { useEffect, useState, useCallback, useRef } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { MessageSquare, Plus, Megaphone, X, RefreshCw, Search, Users, Lock, Loader2 } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { LoadingSpinner, EmptyState, ErrorState, SkeletonList } from '@/components/States';
import { useNav } from '@/contexts/NavContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { dmOtherMember, dmTitle } from '@/lib/directMessages';
import type { Conversation, Profile, Message } from '@/types';

interface ConversationWithDetails extends Conversation {
  last_message?: Message | null;
  dm_title?: string;
  dm_partner?: Profile | null;
  participant_count?: number;
  unread_count?: number;
}

export function ConnectScreen() {
  const { navigate } = useNav();
  const { showToast } = useToast();
  const { profile, session } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [startingWith, setStartingWith] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const isAdmin = profile?.role === 'admin';
  const myId = session?.user?.id || '';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: convs, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false });
      if (convError) { setError(convError.message || 'Failed to load conversations'); setLoading(false); return; }

      const conversationsRaw = (convs || []) as Conversation[];

      const enriched: ConversationWithDetails[] = await Promise.all(
        conversationsRaw.map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.id);

          let dmName: string | undefined;
          let dmPartner: Profile | null = null;
          const participantCount = (participants || []).length;
          if (conv.type === 'dm' && participants) {
            const { data: memberProfiles } = await supabase
              .from('profiles')
              .select('*')
              .in('id', participants.map((p) => p.user_id));
            const members = (memberProfiles || []) as Profile[];
            dmName = dmTitle(members, myId);
            dmPartner = dmOtherMember(members, myId) ?? members[0] ?? null;
          }

          // Count unread messages
          let unreadCount = 0;
          if (lastMsg && lastMsg.sender_id !== myId) {
            const { count } = await supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .neq('sender_id', myId)
              .not('read_by', 'cs', `{${myId}}`);
            unreadCount = count || 0;
          }

          return {
            ...conv,
            last_message: (lastMsg as Message) || null,
            dm_title: dmName,
            dm_partner: dmPartner,
            participant_count: participantCount,
            unread_count: unreadCount,
          };
        })
      );

      enriched.sort((a, b) => {
        const ta = a.last_message?.created_at ? new Date(a.last_message.created_at).getTime() : new Date(a.created_at).getTime();
        const tb = b.last_message?.created_at ? new Date(b.last_message.created_at).getTime() : new Date(b.created_at).getTime();
        return tb - ta;
      });

      setConversations(enriched);
    } catch {
      setError('Unable to connect. Please check your connection and try again.');
    }
    setLoading(false);
    setRefreshing(false);
  }, [myId]);

  useEffect(() => { load(); }, [load]);

  // Global presence channel — track which users are online
  useEffect(() => {
    const channel = supabase.channel('global-presence');
    presenceChannelRef.current = channel;
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const ids = new Set<string>();
        Object.values(state).forEach((presences) => {
          presences.forEach((p: Record<string, unknown>) => {
            if (p.user_id) ids.add(p.user_id as string);
          });
        });
        setOnlineUsers(ids);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && myId) {
          await channel.track({ user_id: myId });
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [myId]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .or(`display_name.ilike.%${q.trim()}%,matric_number.ilike.%${q.trim()}%`)
      .neq('id', myId)
      .limit(10);
    setSearchResults((data as Profile[]) || []);
    setSearching(false);
  };

  const handleCreateBroadcast = async (name: string) => {
    if (!name.trim()) { showToast('Channel name required', 'error'); return; }
    const { error } = await supabase.from('conversations').insert({ name: name.trim(), type: 'broadcast', created_by: myId });
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Broadcast channel created', 'success');
    setShowCreate(false);
    load();
  };

  const handleStartDM = async (otherUserId: string) => {
    setStartingWith(otherUserId);

    const { data: myParticipations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', myId);

    const myConvIds = (myParticipations || []).map((p) => p.conversation_id);

    let existingConv: Conversation | null = null;

    if (myConvIds.length > 0) {
      const { data: sharedParts } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', otherUserId)
        .in('conversation_id', myConvIds);

      const sharedConvIds = (sharedParts || []).map((p) => p.conversation_id);

      if (sharedConvIds.length > 0) {
        const { data: conv } = await supabase
          .from('conversations')
          .select('*')
          .eq('type', 'dm')
          .in('id', sharedConvIds)
          .limit(1)
          .maybeSingle();
        existingConv = (conv as Conversation) || null;
      }
    }

    if (existingConv) {
      setStartingWith(null);
      navigate('chat', { conversation: existingConv });
      return;
    }

    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert({ name: 'Direct Message', type: 'dm', created_by: myId })
      .select('*')
      .single();

    if (createError || !newConv) {
      setStartingWith(null);
      showToast('Could not start conversation', 'error');
      return;
    }

    await supabase.from('conversation_participants').insert([
      { conversation_id: newConv.id, user_id: myId },
      { conversation_id: newConv.id, user_id: otherUserId },
    ]);

    setStartingWith(null);
    showToast('Conversation started', 'success');
    setSearchQuery('');
    setSearchResults([]);
    navigate('chat', { conversation: newConv as Conversation });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    showToast('Conversations refreshed', 'success');
  };

  return (
    <>
      <AppHeader
        title="Connect+"
        showBack={false}
        rightAction={isAdmin ? (
          <button onClick={() => setShowCreate(true)} className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center active:scale-90 transition-transform">
            <Plus className="w-5 h-5" />
          </button>
        ) : undefined}
      />
      <div className="pb-20">
        {/* Search bar */}
        <div className="px-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search students by name or matric no..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-navy-50 dark:bg-dark-surface border border-navy-100 dark:border-dark-border text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Search results */}
        {searchQuery.trim().length >= 2 && (
          <div className="px-4 mt-3">
            {searching ? (
              <div className="flex items-center justify-center gap-2 py-4 text-navy-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p className="text-xs">Searching...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <EmptyState icon={<Search className="w-8 h-8" />} title="No Students Found" message="Try a different name or matric number." />
            ) : (
              <div className="space-y-2">
                {searchResults.map((student) => (
                  <div
                    key={student.id}
                    className="w-full bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-3 flex items-center gap-3 active:scale-95 transition-transform hover:shadow-sm"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center text-sm font-bold overflow-hidden">
                        {student.avatar_url ? <img src={student.avatar_url} alt={student.display_name} className="w-full h-full object-cover" /> : student.display_name?.[0]}
                      </div>
                      {onlineUsers.has(student.id) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-dark-surface" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-navy-800 dark:text-dark-text truncate">{student.display_name}</h3>
                      <p className="text-xs text-navy-400 dark:text-dark-muted truncate">{student.department || 'Student'}</p>
                    </div>
                    <button
                      onClick={() => handleStartDM(student.id)}
                      disabled={startingWith === student.id}
                      className="flex items-center gap-1.5 bg-brand-600 text-white text-xs font-bold px-3 py-2 rounded-lg active:scale-90 transition-transform disabled:opacity-50 flex-shrink-0"
                    >
                      {startingWith === student.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                      Chat
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conversations */}
        {searchQuery.trim().length < 2 && (
          <>
            <div className="px-4 mt-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-500" />
              <h2 className="text-sm font-bold text-navy-700 dark:text-dark-text">Conversations</h2>
              <button onClick={handleRefresh} disabled={refreshing} className="ml-auto text-navy-400 active:scale-90 transition-transform">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="px-4 mt-3"><SkeletonList count={3} /></div>
            ) : error ? (
              <ErrorState message={error} />
            ) : conversations.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="w-8 h-8" />}
                title="No Conversations"
                message="Search for students above to start chatting, or join a broadcast channel."
              />
            ) : (
              <div className="px-4 mt-3 space-y-2">
                {/* Broadcasts section */}
                {conversations.some((c) => c.type === 'broadcast') && (
                  <>
                    <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wide flex items-center gap-1 pt-2">
                      <Megaphone className="w-3 h-3" /> Broadcasts
                    </p>
                    {conversations.filter((c) => c.type === 'broadcast').map((conv) => (
                      <ConversationCard key={conv.id} conv={conv} onOpen={() => navigate('chat', { conversation: conv })} isBroadcast />
                    ))}
                  </>
                )}

                {/* Direct messages section */}
                {conversations.some((c) => c.type !== 'broadcast') && (
                  <>
                    <p className="text-[11px] font-bold text-brand-600 uppercase tracking-wide flex items-center gap-1 pt-3">
                      <MessageSquare className="w-3 h-3" /> Direct Messages
                    </p>
                    {conversations.filter((c) => c.type !== 'broadcast').map((conv) => (
                      <ConversationCard key={conv.id} conv={conv} onOpen={() => navigate('chat', { conversation: conv })} isOnline={conv.dm_partner ? onlineUsers.has(conv.dm_partner.id) : false} />
                    ))}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showCreate && isAdmin && <CreateChannelModal onClose={() => setShowCreate(false)} onCreate={handleCreateBroadcast} />}
    </>
  );
}

function ConversationCard({ conv, onOpen, isBroadcast, isOnline }: { conv: ConversationWithDetails; onOpen: () => void; isBroadcast?: boolean; isOnline?: boolean }) {
  const displayName = isBroadcast
    ? conv.name || 'Broadcast Channel'
    : conv.dm_title || 'Direct Message';
  const avatar = isBroadcast ? null : conv.dm_partner?.avatar_url;
  const initial = isBroadcast ? '' : (conv.dm_partner?.display_name?.[0] || 'S');
  const lastMsg = conv.last_message;

  const preview = lastMsg
    ? lastMsg.deleted_at
      ? 'Message deleted'
      : lastMsg.media_type === 'image'
        ? '📷 Photo'
        : lastMsg.media_type === 'video'
          ? '🎥 Video'
          : lastMsg.media_type === 'document'
            ? '📄 Document'
            : lastMsg.media_type === 'audio'
              ? '🎵 Audio'
              : lastMsg.body || 'Media'
    : isBroadcast
      ? 'No messages yet'
      : 'Say hello!';

  const timestamp = lastMsg?.created_at ? formatLastSeen(lastMsg.created_at) : null;
  const unread = conv.unread_count || 0;

  return (
    <button
      onClick={onOpen}
      className="w-full bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform hover:shadow-sm text-left"
    >
      <div className="relative flex-shrink-0">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0 overflow-hidden ${
          isBroadcast ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-brand-500 to-brand-700'
        }`}>
          {isBroadcast ? <Megaphone className="w-5 h-5" /> : avatar ? <img src={avatar} alt={displayName} className="w-full h-full object-cover" /> : initial}
        </div>
        {!isBroadcast && (
          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-dark-surface ${isOnline ? 'bg-green-500' : 'bg-navy-300'}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-navy-800 dark:text-dark-text truncate">{displayName}</h3>
          {timestamp && <span className={`text-[10px] flex-shrink-0 ${unread > 0 ? 'text-brand-600 font-bold' : 'text-navy-400 dark:text-dark-muted'}`}>{timestamp}</span>}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={`text-xs truncate ${unread > 0 ? 'text-navy-700 dark:text-dark-text font-medium' : 'text-navy-400 dark:text-dark-muted'}`}>{preview}</p>
          {unread > 0 && (
            <span className="flex-shrink-0 min-w-[20px] h-5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function formatLastSeen(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

function CreateChannelModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-dark-surface w-full max-w-[440px] rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-navy-800 dark:text-dark-text">New Broadcast Channel</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-navy-100 dark:bg-dark-surface2 flex items-center justify-center text-navy-500"><X className="w-4 h-4" /></button>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Channel name (e.g. SUG Announcements)" className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500 mb-3" />
        <button onClick={() => onCreate(name)} className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform">Create Channel</button>
      </div>
    </div>
  );
}
