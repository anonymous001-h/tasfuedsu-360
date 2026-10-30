import { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Bookmark, Send, Trash2, Reply, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import type { EngagementTarget, Comment, Profile } from '@/types';

interface EngagementBarProps {
  targetType: EngagementTarget;
  targetId: string;
  autoShowComments?: boolean;
}

interface CommentWithProfile extends Comment {
  profile?: Profile;
}

export function EngagementBar({ targetType, targetId, autoShowComments = false }: EngagementBarProps) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [showComments, setShowComments] = useState(autoShowComments);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<CommentWithProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const [likesRes, commentsRes, bookmarkRes] = await Promise.all([
      supabase.from('likes').select('id, user_id').eq('target_type', targetType).eq('target_id', targetId),
      supabase.from('comments').select('*').eq('target_type', targetType).eq('target_id', targetId).order('created_at', { ascending: true }),
      session?.user?.id
        ? supabase.from('bookmarks').select('id').eq('target_type', targetType).eq('target_id', targetId).eq('user_id', session.user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const allLikes = likesRes.data || [];
    setLikes(allLikes.length);
    setLiked(session?.user?.id ? allLikes.some((l) => l.user_id === session.user.id) : false);
    setBookmarked(!!bookmarkRes.data);

    const allComments = (commentsRes.data || []) as Comment[];

    const userIds = [...new Set(allComments.map((c) => c.user_id).filter(Boolean))] as string[];
    const profilesMap = new Map<string, Profile>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
      (profiles || []).forEach((p) => profilesMap.set(p.id, p as Profile));
    }

    const withProfiles = allComments.map((c) => ({
      ...c,
      profile: profilesMap.get(c.user_id),
    }));

    const topLevel = withProfiles.filter((c) => !c.parent_id);
    const withReplies = topLevel.map((c) => ({
      ...c,
      replies: withProfiles.filter((r) => r.parent_id === c.id),
    }));
    setComments(withReplies);
  }, [targetType, targetId, session?.user?.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!autoShowComments) return;
    const channel = supabase
      .channel(`comments:${targetType}:${targetId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `target_id=eq.${targetId}` },
        () => load()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'likes', filter: `target_id=eq.${targetId}` },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [targetType, targetId, autoShowComments, load]);

  const handleLike = async () => {
    if (!session?.user?.id) { showToast('Sign in to like', 'error'); return; }
    if (liked) {
      setLiked(false); setLikes((n) => n - 1);
      await supabase.from('likes').delete().eq('target_type', targetType).eq('target_id', targetId).eq('user_id', session.user.id);
    } else {
      setLiked(true); setLikes((n) => n + 1);
      await supabase.from('likes').insert({ target_type: targetType, target_id: targetId, user_id: session.user.id });
    }
  };

  const handleBookmark = async () => {
    if (!session?.user?.id) { showToast('Sign in to bookmark', 'error'); return; }
    if (bookmarked) {
      setBookmarked(false);
      await supabase.from('bookmarks').delete().eq('target_type', targetType).eq('target_id', targetId).eq('user_id', session.user.id);
      showToast('Removed bookmark', 'info');
    } else {
      setBookmarked(true);
      await supabase.from('bookmarks').insert({ target_type: targetType, target_id: targetId, user_id: session.user.id });
      showToast('Bookmarked', 'success');
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !session?.user?.id) return;
    setSubmitting(true);
    const { error } = await supabase.from('comments').insert({
      target_type: targetType,
      target_id: targetId,
      user_id: session.user.id,
      body: commentText.trim(),
      parent_id: replyTo?.id || null,
    });
    setSubmitting(false);
    if (error) { showToast(error.message, 'error'); return; }
    setCommentText('');
    setReplyTo(null);
    load();
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) { showToast(error.message, 'error'); return; }
    load();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-5 py-3 border-y border-navy-100 dark:border-dark-border">
        <button onClick={handleLike} className="flex items-center gap-2 active:scale-90 transition-transform">
          <Heart className={`w-5 h-5 ${liked ? 'text-red-500 fill-red-500' : 'text-navy-400 dark:text-dark-muted'}`} />
          <span className={`text-sm font-semibold ${liked ? 'text-red-500' : 'text-navy-500 dark:text-dark-muted'}`}>{likes}</span>
        </button>

        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 active:scale-90 transition-transform">
          <MessageCircle className={`w-5 h-5 ${showComments ? 'text-brand-600 dark:text-brand-400' : 'text-navy-400 dark:text-dark-muted'}`} />
          <span className={`text-sm font-semibold ${showComments ? 'text-brand-600 dark:text-brand-400' : 'text-navy-500 dark:text-dark-muted'}`}>{comments.length}</span>
        </button>

        <button onClick={handleBookmark} className="ml-auto active:scale-90 transition-transform">
          <Bookmark className={`w-5 h-5 ${bookmarked ? 'text-brand-500 fill-brand-500' : 'text-navy-400 dark:text-dark-muted'}`} />
        </button>
      </div>

      {showComments && (
        <div className="mt-4 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
              placeholder={replyTo ? `Reply to ${replyTo.profile?.display_name || 'comment'}...` : 'Write a comment...'}
              className="flex-1 px-4 py-2.5 rounded-full bg-navy-50 dark:bg-dark-surface border border-navy-100 dark:border-dark-border text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500"
            />
            <button
              onClick={handleSubmitComment}
              disabled={submitting || !commentText.trim()}
              className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {replyTo && (
            <div className="flex items-center gap-2 text-xs text-navy-400 dark:text-dark-muted">
              <span>Replying to {replyTo.profile?.display_name || 'comment'}</span>
              <button onClick={() => setReplyTo(null)} className="text-red-400 font-medium">Cancel</button>
            </div>
          )}

          {comments.length === 0 ? (
            <p className="text-sm text-navy-400 dark:text-dark-muted text-center py-4">No comments yet. Be the first!</p>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={session?.user?.id}
                onReply={(c) => { setReplyTo(c); }}
                onDelete={handleDeleteComment}
                formatTime={formatTime}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment, currentUserId, onReply, onDelete, formatTime }: {
  comment: CommentWithProfile;
  currentUserId?: string;
  onReply: (c: CommentWithProfile) => void;
  onDelete: (id: string) => void;
  formatTime: (d: string) => string;
}) {
  const isOwn = comment.user_id === currentUserId;
  const isAdmin = comment.profile?.role === 'admin';
  const name = comment.profile?.display_name || 'Student';

  return (
    <div className="space-y-2">
      <div className="bg-navy-50 dark:bg-dark-surface rounded-2xl p-3.5">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-navy-700 dark:text-dark-text">{isOwn ? 'You' : name}</span>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                <Shield className="w-2.5 h-2.5" /> ADMIN
              </span>
            )}
          </div>
          <span className="text-[10px] text-navy-400 dark:text-dark-muted">{formatTime(comment.created_at)}</span>
        </div>
        <p className="text-sm text-navy-700 dark:text-dark-text leading-relaxed">{comment.body}</p>
        <div className="flex items-center gap-3 mt-2">
          <button onClick={() => onReply(comment)} className="flex items-center gap-1 text-[11px] text-navy-400 dark:text-dark-muted font-medium hover:text-brand-500">
            <Reply className="w-3 h-3" /> Reply
          </button>
          {isOwn && (
            <button onClick={() => onDelete(comment.id)} className="flex items-center gap-1 text-[11px] text-red-400 font-medium">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-4 pl-4 border-l-2 border-navy-100 dark:border-dark-border space-y-2">
          {comment.replies.map((reply) => {
            const replyOwn = reply.user_id === currentUserId;
            const replyAdmin = reply.profile?.role === 'admin';
            const replyName = reply.profile?.display_name || 'Student';
            return (
              <div key={reply.id} className="bg-navy-50 dark:bg-dark-surface2 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-navy-700 dark:text-dark-text">{replyOwn ? 'You' : replyName}</span>
                    {replyAdmin && (
                      <span className="inline-flex items-center gap-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        <Shield className="w-2.5 h-2.5" /> ADMIN
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-navy-400 dark:text-dark-muted">{formatTime(reply.created_at)}</span>
                </div>
                <p className="text-sm text-navy-700 dark:text-dark-text leading-relaxed">{reply.body}</p>
                {replyOwn && (
                  <button onClick={() => onDelete(reply.id)} className="flex items-center gap-1 text-[11px] text-red-400 font-medium mt-1.5">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
