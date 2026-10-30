import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import {
  Send, Megaphone, MessageSquare, Check, CheckCheck, Lock, Video,
  Reply, Forward, Trash2, Smile, X, MoreVertical, CornerUpRight,
  AlertTriangle, Paperclip, Camera, Film, FileText, Music, Download,
  Copy, Trash, Eye, XCircle, Image as ImageIcon, Loader2, ChevronDown, Keyboard, Pencil,
} from 'lucide-react';
import { PhoneShell } from '@/components/PhoneShell';
import { AppHeader } from '@/components/AppHeader';
import { LoadingSpinner, EmptyState } from '@/components/States';
import { ConfirmModal } from '@/components/ConfirmModal';
import { EmojiPicker } from '@/components/EmojiPicker';
import { dmOtherMember, dmTitle } from '@/lib/directMessages';
import { useNav } from '@/contexts/NavContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import type { Conversation, Message, Profile, MessageReaction, MediaType } from '@/types';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

interface EnrichedMessage extends Message {
  reactions: MessageReaction[];
  reply_to?: Message | null;
}

type DeleteMode = 'me' | 'everyone';

export function ChatScreen() {
  const { params, goBack } = useNav();
  const { session, profile } = useAuth();
  const { showToast } = useToast();
  const conversation = params.conversation as Conversation | undefined;
  const [messages, setMessages] = useState<EnrichedMessage[]>([]);
  const [senders, setSenders] = useState<Record<string, Profile>>({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editTarget, setEditTarget] = useState<Message | null>(null);
  const [activeMenu, setActiveMenu] = useState<{ msgId: string; x: number; y: number } | null>(null);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ msg: Message; mode: DeleteMode } | null>(null);
  const [forwardTarget, setForwardTarget] = useState<Message | null>(null);
  const [forwardOptions, setForwardOptions] = useState<{ conv: Conversation; label: string }[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dmMembers, setDmMembers] = useState<Profile[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const myId = session?.user?.id || '';

  const isBroadcast = conversation?.type === 'broadcast';
  const isAdmin = profile?.role === 'admin';
  const canSendMessages = isBroadcast ? isAdmin : true;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  }, []);

  const loadMessages = useCallback(async () => {
    if (!conversation) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });
    const rawMessages = (data as Message[]) || [];

    const msgIds = rawMessages.map((m) => m.id);
    let reactionsMap: Record<string, MessageReaction[]> = {};
    if (msgIds.length > 0) {
      const { data: reactions } = await supabase.from('message_reactions').select('*').in('message_id', msgIds);
      (reactions || []).forEach((r) => {
        const reaction = r as MessageReaction;
        if (!reactionsMap[reaction.message_id]) reactionsMap[reaction.message_id] = [];
        reactionsMap[reaction.message_id].push(reaction);
      });
    }

    const messageMap: Record<string, Message> = {};
    rawMessages.forEach((m) => { messageMap[m.id] = m; });

    const enriched: EnrichedMessage[] = rawMessages.map((m) => ({
      ...m,
      reactions: reactionsMap[m.id] || [],
      reply_to: m.reply_to_id ? messageMap[m.reply_to_id] || null : null,
    }));

    setMessages(enriched);
    setLoading(false);

    const senderIds = [...new Set(rawMessages.map((m) => m.sender_id).filter(Boolean))] as string[];
    if (senderIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', senderIds);
      const map: Record<string, Profile> = {};
      (profiles || []).forEach((p) => { map[p.id] = p as Profile; });
      setSenders(map);
    }

    if (!isBroadcast) {
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversation.id);
      const ids = (participants || []).map((p) => p.user_id);
      if (ids.length > 0) {
        const { data: members } = await supabase.from('profiles').select('*').in('id', ids);
        setDmMembers((members as Profile[]) || []);
      }
    }

    scrollToBottom();
  }, [conversation, scrollToBottom, isBroadcast, myId]);

  // Mark messages as read on load
  useEffect(() => {
    if (!conversation || !myId) return;
    const markRead = async () => {
      const unread = messages.filter((m) => m.sender_id !== myId && !m.read_by?.includes(myId));
      for (const msg of unread) {
        await supabase
          .from('messages')
          .update({ read_by: [...(msg.read_by || []), myId], read: true })
          .eq('id', msg.id);
      }
    };
    if (messages.length > 0) markRead();
  }, [messages, conversation, myId]);

  useEffect(() => {
    loadMessages();
    if (!conversation) return;

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          setMessages((prev) => {
            const newMsg = payload.new as Message;
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, reactions: [], reply_to: null }];
          });
          scrollToBottom();
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          setMessages((prev) => prev.map((m) => (m.id === (payload.new as Message).id ? { ...m, ...(payload.new as Message), reactions: m.reactions, reply_to: m.reply_to } : m)));
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== (payload.old as Message).id));
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_reactions' },
        () => { loadMessages(); }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'message_reactions' },
        () => { loadMessages(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversation, loadMessages, scrollToBottom]);

  // Presence: track online users in this conversation
  useEffect(() => {
    if (!conversation || isBroadcast) return;
    const presenceChannel = supabase.channel(`presence:${conversation.id}`);
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
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
          await presenceChannel.track({ user_id: myId });
        }
      });
    return () => { supabase.removeChannel(presenceChannel); };
  }, [conversation, isBroadcast, myId]);

  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const sync = () => setViewportHeight(vv.height);
    sync();
    vv.addEventListener('resize', sync);
    return () => vv.removeEventListener('resize', sync);
  }, []);

  // Close menus on outside click / scroll
  useEffect(() => {
    const closeMenus = () => { setActiveMenu(null); setShowReactions(null); };
    if (activeMenu || showReactions) {
      window.addEventListener('click', closeMenus);
      window.addEventListener('scroll', closeMenus, true);
      return () => { window.removeEventListener('click', closeMenus); window.removeEventListener('scroll', closeMenus, true); };
    }
  }, [activeMenu, showReactions]);

  // Auto-grow textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const visibleMessages = useMemo(() => {
    return messages.filter((m) => !m.deleted_for?.includes(myId));
  }, [messages, myId]);

  const cancelEdit = () => {
    setEditTarget(null);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const startEdit = (msg: Message) => {
    setEditTarget(msg);
    setReplyTo(null);
    setActiveMenu(null);
    setShowEmoji(false);
    setInput(msg.body);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    });
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    const text = input.trim();
    if (!text) return;
    if (text === editTarget.body) { cancelEdit(); return; }
    setSending(true);
    const { error } = await supabase.rpc('edit_message', { p_message_id: editTarget.id, p_body: text });
    setSending(false);
    if (error) { showToast('Could not edit message', 'error'); return; }
    const editedAt = new Date().toISOString();
    setMessages((prev) => prev.map((m) => (m.id === editTarget.id ? { ...m, body: text, edited_at: editedAt } : m)));
    cancelEdit();
  };

  const handleSend = async () => {
    if (editTarget) { saveEdit(); return; }
    if ((!input.trim() && !uploading) || !conversation || !myId || !canSendMessages) return;
    if (input.trim() === '') return;
    setSending(true);
    const msgText = input.trim();
    const replyId = replyTo?.id || null;
    setInput('');
    setReplyTo(null);
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: EnrichedMessage = {
      id: tempId,
      conversation_id: conversation.id,
      sender_id: myId,
      body: msgText,
      read: false,
      created_at: new Date().toISOString(),
      reply_to_id: replyId,
      forwarded_from_id: null,
      deleted_at: null,
      media_url: null,
      media_type: null,
      file_name: null,
      file_size: null,
      deleted_for: [],
      read_by: [],
      reactions: [],
      reply_to: replyTo,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: myId,
      body: msgText,
      reply_to_id: replyId,
    });

    setSending(false);
    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(msgText);
      if (replyTo) setReplyTo(replyTo);
      showToast('Failed to send message', 'error');
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const uploadMedia = async (file: File, type: MediaType) => {
    if (!conversation || !myId) return;
    if (file.size > 25 * 1024 * 1024) { showToast('File too large (max 25MB)', 'error'); return; }
    setUploading(true);
    setShowAttach(false);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `chat-media/${conversation.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('chat-media').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(fileName);

      const tempId = `temp-${Date.now()}`;
      const optimistic: EnrichedMessage = {
        id: tempId,
        conversation_id: conversation.id,
        sender_id: myId,
        body: '',
        read: false,
        created_at: new Date().toISOString(),
        reply_to_id: null,
        forwarded_from_id: null,
        deleted_at: null,
        media_url: urlData.publicUrl,
        media_type: type,
        file_name: file.name,
        file_size: file.size,
        deleted_for: [],
        read_by: [],
        reactions: [],
        reply_to: null,
      };
      setMessages((prev) => [...prev, optimistic]);
      scrollToBottom();

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: myId,
        body: '',
        media_url: urlData.publicUrl,
        media_type: type,
        file_name: file.name,
        file_size: file.size,
      });
      if (error) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        showToast('Failed to send media', 'error');
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    } catch {
      showToast('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (msg: Message, mode: DeleteMode) => {
    if (mode === 'me') {
      const newDeletedFor = [...(msg.deleted_for || []), myId];
      const { error } = await supabase.from('messages').update({ deleted_for: newDeletedFor }).eq('id', msg.id);
      if (error) { showToast('Could not delete message', 'error'); return; }
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, deleted_for: newDeletedFor } : m)));
      showToast('Deleted for you', 'success');
    } else {
      const { error } = await supabase.rpc('delete_message_for_everyone', { p_message_id: msg.id });
      if (error) { showToast('Could not delete message', 'error'); return; }
      const deletedAt = new Date().toISOString();
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, deleted_at: deletedAt, body: '', media_url: null } : m)));
      showToast('Deleted for everyone', 'success');
    }
  };

  const handleReact = async (msg: Message, emoji: string) => {
    setShowReactions(null);
    setActiveMenu(null);
    const existing = messages.find((m) => m.id === msg.id)?.reactions.find((r) => r.user_id === myId && r.emoji === emoji);
    if (existing) {
      const { error } = await supabase.from('message_reactions').delete().eq('id', existing.id);
      if (error) showToast('Could not remove reaction', 'error');
    } else {
      const { error } = await supabase.from('message_reactions').insert({ message_id: msg.id, user_id: myId, emoji });
      if (error) showToast('Could not add reaction', 'error');
    }
  };

  const handleCopy = (msg: Message) => {
    if (msg.body) {
      navigator.clipboard?.writeText(msg.body).then(() => showToast('Copied to clipboard', 'success'));
    }
    setActiveMenu(null);
  };

  const loadForwardConversations = async () => {
    const { data: convs } = await supabase.from('conversations').select('*').order('created_at', { ascending: false });
    const list = (convs as Conversation[]) || [];
    const dmIds = list.filter((c) => c.type === 'dm').map((c) => c.id);

    let partRows: { conversation_id: string; user_id: string }[] = [];
    if (dmIds.length > 0) {
      const { data } = await supabase.from('conversation_participants').select('conversation_id, user_id').in('conversation_id', dmIds);
      partRows = (data as { conversation_id: string; user_id: string }[]) || [];
    }

    const userIds = [...new Set(partRows.map((p) => p.user_id))];
    const profileById = new Map<string, Profile>();
    if (userIds.length > 0) {
      const { data } = await supabase.from('profiles').select('*').in('id', userIds);
      ((data as Profile[]) || []).forEach((p) => profileById.set(p.id, p));
    }

    const membersByConv: Record<string, Profile[]> = {};
    partRows.forEach((p) => {
      const profile = profileById.get(p.user_id);
      if (profile) membersByConv[p.conversation_id] = [...(membersByConv[p.conversation_id] || []), profile];
    });

    setForwardOptions(
      list
        .filter((c) => (c.type === 'broadcast' ? isAdmin : (membersByConv[c.id] || []).some((m) => m.id === myId)))
        .map((c) => ({
          conv: c,
          label: c.type === 'dm' ? dmTitle(membersByConv[c.id] || [], myId) : c.name || 'Conversation',
        })),
    );
  };

  const handleForward = async (msg: Message, targetConv: Conversation) => {
    const payload: Record<string, unknown> = {
      conversation_id: targetConv.id,
      sender_id: myId,
      body: msg.body,
      forwarded_from_id: msg.id,
    };
    if (msg.media_url) {
      payload.media_url = msg.media_url;
      payload.media_type = msg.media_type;
      payload.file_name = msg.file_name;
      payload.file_size = msg.file_size;
    }
    const { error } = await supabase.from('messages').insert(payload);
    if (error) { showToast('Could not forward message', 'error'); return; }
    showToast('Message forwarded', 'success');
    setForwardTarget(null);
  };

  const handleMessageLongPress = (msg: Message, e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = 'touches' in e ? e.touches[0] : e;
    const x = 'clientX' in touch ? touch.clientX : 0;
    const y = 'clientY' in touch ? touch.clientY : 0;
    setActiveMenu({ msgId: msg.id, x, y });
  };

  const startLongPress = (msg: Message) => {
    longPressTimer.current = setTimeout(() => handleMessageLongPress(msg, { preventDefault: () => {}, stopPropagation: () => {} } as unknown as React.MouseEvent), 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? input.length;
    const end = el?.selectionEnd ?? input.length;
    setInput(input.slice(0, start) + emoji + input.slice(end));
    const caret = start + emoji.length;
    requestAnimationFrame(() => {
      if (el && document.activeElement === el) {
        el.setSelectionRange(caret, caret);
      }
    });
  };

  const toggleEmojiTray = () => {
    if (showEmoji) {
      setShowEmoji(false);
      inputRef.current?.focus();
      return;
    }
    setShowAttach(false);
    inputRef.current?.blur();
    setShowEmoji(true);
  };

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return format(d, 'h:mm a');
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d');
  };

  if (!conversation) {
    return (
      <PhoneShell showBottomNav={false}>
        <AppHeader title="Chat" showBack />
        <div className="flex-1 flex items-center justify-center">
          <button onClick={goBack} className="text-brand-600 font-bold text-sm">Go back</button>
        </div>
      </PhoneShell>
    );
  }

  const dmPartner = dmOtherMember(dmMembers, myId);
  const deliveryStatus = (msg: Message): TickStatus => {
    if ((msg.read_by || []).some((id) => id !== myId)) return 'seen';
    if (!msg.id.startsWith('temp-') && !isBroadcast && dmPartner && onlineUsers.has(dmPartner.id)) return 'delivered';
    return 'sent';
  };

  const headerTitle = isBroadcast ? conversation.name || 'Broadcast' : dmTitle(dmMembers, myId);
  const headerSubtitle = isBroadcast
    ? null
    : dmPartner && onlineUsers.has(dmPartner.id) ? 'Online' : dmPartner ? 'Offline' : null;

  return (
    <PhoneShell showBottomNav={false} showHeader={false}>
      <AppHeader
        title={headerTitle}
        showBack
        rightAction={
          !isBroadcast ? (
            <button onClick={() => showToast('Video calling coming soon', 'info')} className="w-9 h-9 rounded-xl flex items-center justify-center text-navy-600 dark:text-dark-muted hover:bg-navy-100 dark:hover:bg-dark-surface active:scale-90 transition-all">
              <Video className="w-4.5 h-4.5" />
            </button>
          ) : undefined
        }
      />
      <div className="fixed inset-x-0 top-0 mx-auto w-full max-w-[480px] flex flex-col bg-navy-50 dark:bg-dark-bg overflow-hidden pt-14" style={{ height: viewportHeight ?? '100dvh' }}>
        {/* Broadcast banner */}
        {isBroadcast && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800/30 px-4 py-2 flex items-center gap-2 flex-shrink-0">
            <Megaphone className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              {isAdmin ? 'Broadcast channel — only admins can send' : 'Admin broadcasts are read-only'}
            </p>
          </div>
        )}

        {/* Online status for DM */}
        {!isBroadcast && headerSubtitle && (
          <div className="px-4 py-1.5 bg-white dark:bg-dark-surface border-b border-navy-50 dark:border-dark-border flex items-center justify-center gap-1.5 flex-shrink-0">
            <span className={`w-2 h-2 rounded-full ${headerSubtitle === 'Online' ? 'bg-green-500' : 'bg-navy-300'}`} />
            <span className="text-[11px] text-navy-500 dark:text-dark-muted font-medium">{headerSubtitle}</span>
          </div>
        )}

        {/* Edit banner */}
        {editTarget && (
          <div className="flex items-start gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 flex-shrink-0">
            <Pencil className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400">Editing message</p>
              <p className="text-xs text-navy-500 dark:text-dark-muted truncate">{editTarget.body}</p>
            </div>
            <button onClick={cancelEdit} aria-label="Cancel edit" className="text-navy-400 active:scale-90 transition-transform">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Reply preview */}
        {replyTo && (
          <div className="flex items-start gap-2 px-4 py-2 bg-navy-100 dark:bg-dark-surface border-l-4 border-brand-500 flex-shrink-0">
            <CornerUpRight className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-brand-600">Replying to {replyTo.sender_id === myId ? 'yourself' : senders[replyTo.sender_id || '']?.display_name || 'Student'}</p>
              <p className="text-xs text-navy-500 dark:text-dark-muted truncate">{replyTo.body || (replyTo.media_url ? 'Media' : 'Deleted message')}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-navy-400 active:scale-90 transition-transform">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 pb-2">
          {loading ? <LoadingSpinner text="Loading messages..." /> : visibleMessages.length === 0 ? (
            <EmptyState icon={<MessageSquare className="w-8 h-8" />} title="No Messages Yet" message={canSendMessages ? 'Start the conversation by sending a message below.' : 'Messages will appear here once they are sent.'} />
          ) : (
            visibleMessages.map((msg) => {
              const isOwn = msg.sender_id === myId;
              const sender = msg.sender_id ? senders[msg.sender_id] : null;
              const senderName = sender?.display_name || 'Student';
              const senderIsAdmin = sender?.role === 'admin';
              const isDeleted = !!msg.deleted_at;
              const hasMedia = !!msg.media_url;

              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                  <div className={`max-w-[78%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    {/* Reply quote */}
                    {msg.reply_to && !isDeleted && (
                      <div className={`text-[11px] mb-1 px-2.5 py-1.5 rounded-lg border-l-2 ${
                        isOwn ? 'border-brand-300 bg-brand-50 dark:bg-brand-900/20 text-right' : 'border-navy-300 bg-navy-50 dark:bg-dark-surface2'
                      }`}>
                        <p className="font-bold text-navy-600 dark:text-dark-muted">
                          {msg.reply_to.sender_id === myId ? 'You' : senders[msg.reply_to.sender_id || '']?.display_name || 'Student'}
                        </p>
                        <p className="text-navy-500 dark:text-dark-muted truncate">{msg.reply_to.body || (msg.reply_to.media_url ? 'Media' : 'Deleted message')}</p>
                      </div>
                    )}

                    {/* Forwarded indicator */}
                    {msg.forwarded_from_id && !isDeleted && (
                      <p className={`text-[10px] mb-1 flex items-center gap-1 ${isOwn ? 'text-white/50' : 'text-navy-400'}`}>
                        <Forward className="w-2.5 h-2.5" /> Forwarded
                      </p>
                    )}

                    {/* Message bubble */}
                    <div
                      onTouchStart={() => !isDeleted && startLongPress(msg)}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                      onContextMenu={(e) => { if (!isDeleted) handleMessageLongPress(msg, e); }}
                      className={`relative rounded-2xl px-4 py-2.5 ${
                        isOwn ? 'bg-brand-600 text-white rounded-br-md' : 'bg-white dark:bg-dark-surface text-navy-800 dark:text-dark-text rounded-bl-md border border-navy-100 dark:border-dark-border'
                      } ${isDeleted ? 'opacity-50 italic' : ''} ${hasMedia && !msg.body ? 'p-1' : ''}`}
                    >
                      {!isOwn && isBroadcast && (
                        <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 mb-0.5 flex items-center gap-1">
                          {senderName}
                          {senderIsAdmin && <span className="bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-[8px] px-1 py-0.5 rounded">ADMIN</span>}
                        </p>
                      )}

                      {/* Media content */}
                      {hasMedia && !isDeleted && (
                        <MediaContent msg={msg} isOwn={isOwn} onImageClick={(url) => setLightbox(url)} />
                      )}

                      {/* Text content */}
                      {isDeleted ? (
                        <p className="text-sm leading-relaxed italic flex items-center gap-1.5">
                          <Trash2 className="w-3 h-3" /> This message was deleted
                        </p>
                      ) : msg.body ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                      ) : null}

                      {/* Timestamp + read receipts */}
                      <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[9px] ${isOwn ? 'text-white/60' : 'text-navy-400 dark:text-dark-muted'}`}>
                          {format(new Date(msg.created_at), 'h:mm a')}
                        </span>
                        {msg.edited_at && (
                          <span className={`text-[9px] italic ${isOwn ? 'text-white/60' : 'text-navy-400 dark:text-dark-muted'}`}>edited</span>
                        )}
                        {isOwn && !isDeleted && (
                          <TickIcon status={deliveryStatus(msg)} />
                        )}
                      </div>

                      {/* Menu trigger */}
                      {!isDeleted && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMessageLongPress(msg, e); }}
                          className={`absolute top-1 ${isOwn ? 'left-1' : 'right-1'} opacity-0 active:opacity-100 hover:opacity-100 transition-opacity`}
                        >
                          <MoreVertical className={`w-3.5 h-3.5 ${isOwn ? 'text-white/40' : 'text-navy-300'}`} />
                        </button>
                      )}
                    </div>

                    {/* Reactions display */}
                    {msg.reactions.length > 0 && !isDeleted && (
                      <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        {Object.entries(
                          msg.reactions.reduce<Record<string, number>>((acc, r) => {
                            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([emoji, count]) => (
                          <span
                            key={emoji}
                            className={`text-xs px-1.5 py-0.5 rounded-full border ${
                              msg.reactions.some((r) => r.user_id === myId && r.emoji === emoji)
                                ? 'bg-brand-100 dark:bg-brand-900/30 border-brand-300'
                                : 'bg-navy-50 dark:bg-dark-surface2 border-navy-100 dark:border-dark-border'
                            }`}
                          >
                            {emoji} {count > 1 && count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Context menu */}
        {activeMenu && (
          <ContextMenu
            x={activeMenu.x}
            y={activeMenu.y}
            msg={messages.find((m) => m.id === activeMenu.msgId)!}
            isOwn={messages.find((m) => m.id === activeMenu.msgId)?.sender_id === myId}
            onReply={(msg) => { setReplyTo(msg); setActiveMenu(null); }}
            onCopy={handleCopy}
            onDeleteForMe={(msg) => { setDeleteTarget({ msg, mode: 'me' }); setActiveMenu(null); }}
            onDeleteForEveryone={(msg) => { setDeleteTarget({ msg, mode: 'everyone' }); setActiveMenu(null); }}
            onForward={(msg) => { setForwardTarget(msg); loadForwardConversations(); setActiveMenu(null); }}
            onReact={handleReact}
            onEdit={startEdit}
            myEmojis={messages.find((m) => m.id === activeMenu.msgId)?.reactions.filter((r) => r.user_id === myId).map((r) => r.emoji) ?? []}
            onShowReactions={(msgId) => { setShowReactions(msgId); setActiveMenu(null); }}
          />
        )}

        {/* Quick reactions popover */}
        {showReactions && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-dark-surface rounded-full shadow-2xl border border-navy-100 dark:border-dark-border px-3 py-2 flex gap-2 animate-scale-in">
            {QUICK_REACTIONS.map((emoji) => (
              <button key={emoji} onClick={() => { const msg = messages.find((m) => m.id === showReactions); if (msg) handleReact(msg, emoji); }} className="text-xl active:scale-125 transition-transform">
                {emoji}
              </button>
            ))}
            <button onClick={() => setShowReactions(null)} className="text-navy-400 ml-1"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Input bar */}
        {canSendMessages ? (
          <div className="flex-shrink-0 bg-white dark:bg-dark-surface border-t border-navy-100 dark:border-dark-border relative">
            {/* Attachment menu */}
            {showAttach && (
              <div className="absolute bottom-full left-0 right-0 bg-white dark:bg-dark-surface border-t border-navy-100 dark:border-dark-border rounded-t-2xl shadow-2xl animate-slide-up overflow-hidden">
                <div className="grid grid-cols-4 gap-1 p-3">
                  <AttachButton icon={<Camera className="w-5 h-5" />} label="Image" color="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400" onClick={() => fileInputRef.current?.click()} />
                  <AttachButton icon={<Film className="w-5 h-5" />} label="Video" color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" onClick={() => videoInputRef.current?.click()} />
                  <AttachButton icon={<FileText className="w-5 h-5" />} label="Document" color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" onClick={() => docInputRef.current?.click()} />
                  <AttachButton icon={<Music className="w-5 h-5" />} label="Audio" color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" onClick={() => audioInputRef.current?.click()} />
                </div>
              </div>
            )}

            <div className="flex items-end gap-2 px-3 py-2.5">
              {/* Emoji toggle */}
              <button
                onClick={toggleEmojiTray}
                className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all flex-shrink-0 ${showEmoji ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600' : 'text-navy-500 dark:text-dark-muted hover:bg-navy-100 dark:hover:bg-dark-surface'}`}
                aria-label={showEmoji ? 'Switch to keyboard' : 'Open emoji picker'}
              >
                {showEmoji ? <Keyboard className="w-5 h-5" /> : <Smile className="w-5 h-5" />}
              </button>

              {/* Attachment toggle */}
              <button
                onClick={() => { setShowAttach(!showAttach); setShowEmoji(false); }}
                className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all flex-shrink-0 ${showAttach ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600' : 'text-navy-500 dark:text-dark-muted hover:bg-navy-100 dark:hover:bg-dark-surface'}`}
                aria-label="Attachments"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Text input */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                onFocus={() => { setShowEmoji(false); setShowAttach(false); }}
                placeholder={replyTo ? 'Reply...' : 'Type a message...'}
                rows={1}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-navy-50 dark:bg-dark-bg border border-navy-100 dark:border-dark-border text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-400 resize-none scrollbar-hide"
                style={{ maxHeight: '120px' }}
              />

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={sending || uploading || !input.trim()}
                className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40 flex-shrink-0"
                aria-label="Send message"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <EmojiPicker open={showEmoji} onClose={() => setShowEmoji(false)} onEmojiSelect={insertEmoji} />
          </div>
        ) : (
          <div className="flex-shrink-0 bg-white dark:bg-dark-surface border-t border-navy-100 dark:border-dark-border px-3 py-3">
            <div className="flex-1 px-4 py-2.5 rounded-full bg-navy-100 dark:bg-dark-surface2 text-navy-400 dark:text-dark-muted text-sm text-center flex items-center justify-center gap-2">
              <Lock className="w-3.5 h-3.5" /> {isBroadcast ? 'Read-only broadcast' : 'Admin view: read-only'}
            </div>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMedia(f, 'image'); e.target.value = ''; }} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMedia(f, 'video'); e.target.value = ''; }} />
      <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMedia(f, 'document'); e.target.value = ''; }} />
      <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMedia(f, 'audio'); e.target.value = ''; }} />

      {/* Delete confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        title={deleteTarget?.mode === 'everyone' ? 'Delete for Everyone?' : 'Delete for Me?'}
        message={deleteTarget?.mode === 'everyone' ? 'This message will be deleted for everyone in this conversation.' : 'This message will only be deleted from your view.'}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget.msg, deleteTarget.mode); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
        danger
        icon={<AlertTriangle className="w-6 h-6" />}
      />

      {/* Forward modal */}
      {forwardTarget && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={() => setForwardTarget(null)}>
          <div className="bg-white dark:bg-dark-surface w-full max-w-[440px] rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-navy-800 dark:text-dark-text flex items-center gap-2"><Forward className="w-5 h-5 text-brand-500" /> Forward to...</h3>
              <button onClick={() => setForwardTarget(null)} className="w-8 h-8 rounded-full bg-navy-100 dark:bg-dark-surface2 flex items-center justify-center text-navy-500"><X className="w-4 h-4" /></button>
            </div>
            {forwardOptions.length === 0 ? (
              <p className="text-sm text-navy-400 text-center py-4">No conversations available</p>
            ) : (
              <div className="space-y-2">
                {forwardOptions.map(({ conv, label }) => (
                  <button
                    key={conv.id}
                    onClick={() => handleForward(forwardTarget, conv)}
                    className="w-full bg-navy-50 dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-3 flex items-center gap-3 active:scale-95 transition-transform text-left"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
                      conv.type === 'broadcast' ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-brand-500 to-brand-700'
                    }`}>
                      {conv.type === 'broadcast' ? <Megaphone className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-navy-800 dark:text-dark-text truncate">{label}</h4>
                      <p className="text-xs text-navy-400 capitalize">{conv.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center z-10">
            <X className="w-5 h-5" />
          </button>
          <img src={lightbox} alt="Full size" className="max-w-full max-h-full object-contain" />
          <a href={lightbox} download className="absolute bottom-8 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-white/20 text-white text-sm font-medium flex items-center gap-2 hover:bg-white/30 transition-colors">
            <Download className="w-4 h-4" /> Download
          </a>
        </div>
      )}
    </PhoneShell>
  );
}

function MediaContent({ msg, isOwn, onImageClick }: { msg: Message; isOwn: boolean; onImageClick: (url: string) => void }) {
  const mediaUrl = msg.media_url!;
  const mediaType = msg.media_type;

  if (mediaType === 'image') {
    return (
      <div className="relative rounded-xl overflow-hidden mb-1 cursor-pointer" onClick={() => onImageClick(mediaUrl)}>
        <img src={mediaUrl} alt={msg.file_name || 'Photo'} className="w-full max-w-[240px] h-auto max-h-[200px] object-cover" />
      </div>
    );
  }

  if (mediaType === 'video') {
    return (
      <div className="rounded-xl overflow-hidden mb-1 max-w-[240px]">
        <video src={mediaUrl} controls className="w-full h-auto max-h-[200px]" />
      </div>
    );
  }

  // Document or audio
  const isAudio = mediaType === 'audio';
  const sizeStr = msg.file_size ? formatFileSize(msg.file_size) : '';
  return (
    <div className={`rounded-xl p-3 mb-1 flex items-center gap-3 ${isOwn ? 'bg-brand-700/30' : 'bg-navy-50 dark:bg-dark-surface2'} max-w-[260px]`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isAudio ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
        {isAudio ? <Music className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate">{msg.file_name || (isAudio ? 'Audio' : 'Document')}</p>
        {sizeStr && <p className="text-[10px] opacity-60">{sizeStr}</p>}
      </div>
      {isAudio && <audio src={mediaUrl} controls className="hidden" />}
      <a href={mediaUrl} download className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isOwn ? 'text-white/80 hover:bg-white/10' : 'text-navy-500 hover:bg-navy-100 dark:hover:bg-dark-surface'}`} aria-label="Download">
        <Download className="w-4 h-4" />
      </a>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function AttachButton({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 py-2 active:scale-95 transition-transform">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium text-navy-600 dark:text-dark-muted">{label}</span>
    </button>
  );
}

function ContextMenu({
  x, y, msg, isOwn, myEmojis,
  onReply, onCopy, onEdit, onDeleteForMe, onDeleteForEveryone, onForward, onReact, onShowReactions,
}: {
  x: number; y: number; msg: Message; isOwn: boolean; myEmojis: string[];
  onEdit: (m: Message) => void;
  onReply: (m: Message) => void;
  onCopy: (m: Message) => void;
  onDeleteForMe: (m: Message) => void;
  onDeleteForEveryone: (m: Message) => void;
  onForward: (m: Message) => void;
  onReact: (m: Message, e: string) => void;
  onShowReactions: (id: string) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: y, left: x });

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let top = y;
      let left = x;
      if (left + rect.width > vw - 8) left = vw - rect.width - 8;
      if (left < 8) left = 8;
      if (top + rect.height > vh - 8) top = y - rect.height;
      if (top < 8) top = 8;
      setPos({ top, left });
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] bg-white dark:bg-dark-surface rounded-xl shadow-2xl border border-navy-100 dark:border-dark-border py-1 min-w-[160px] animate-scale-in"
      style={{ top: pos.top, left: pos.left }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Quick reactions bar */}
      <div className="flex gap-0.5 px-2 py-1.5 border-b border-navy-50 dark:border-dark-border">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onReact(msg, emoji)}
            aria-pressed={myEmojis.includes(emoji)}
            className={`text-lg active:scale-125 transition-all duration-200 w-8 h-8 flex items-center justify-center rounded-lg ${
              myEmojis.includes(emoji)
                ? 'bg-brand-100 dark:bg-brand-900/40 ring-2 ring-brand-500 scale-110'
                : 'hover:bg-navy-50 dark:hover:bg-dark-surface2'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
      <MenuBtn icon={<Reply className="w-3.5 h-3.5" />} label="Reply" onClick={() => onReply(msg)} />
      {isOwn && msg.body && !msg.media_url && <MenuBtn icon={<Pencil className="w-3.5 h-3.5" />} label="Edit" onClick={() => onEdit(msg)} />}
      <MenuBtn icon={<Copy className="w-3.5 h-3.5" />} label="Copy" onClick={() => onCopy(msg)} />
      <MenuBtn icon={<Forward className="w-3.5 h-3.5" />} label="Forward" onClick={() => onForward(msg)} />
      <MenuBtn icon={<Trash className="w-3.5 h-3.5" />} label="Delete for Me" onClick={() => onDeleteForMe(msg)} danger />
      {isOwn && <MenuBtn icon={<XCircle className="w-3.5 h-3.5" />} label="Delete for Everyone" onClick={() => onDeleteForEveryone(msg)} danger />}
    </div>
  );
}

type TickStatus = 'sent' | 'delivered' | 'seen';

function TickIcon({ status }: { status: TickStatus }) {
  if (status === 'sent') {
    return <Check className="w-3 h-3 text-white/70" aria-label="Sent" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="w-3 h-3 text-white/70" aria-label="Delivered" />;
  }
  return <CheckCheck className="w-3 h-3 text-sky-300" aria-label="Seen" />;
}

function MenuBtn({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-2 flex items-center gap-2.5 text-sm font-medium transition-colors ${
        danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-navy-700 dark:text-dark-text hover:bg-navy-50 dark:hover:bg-dark-surface2'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
