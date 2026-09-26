import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Heart, MessageCircle } from 'lucide-react';

interface LoveNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
}

interface Note {
  id: string;
  author: string;
  text: string;
  time: string;
  likes: number;
}

const INITIAL_NOTES: Note[] = [
  { id: '1', author: 'Your Soulmate ❤️', text: 'You are the most beautiful person inside and out! Happy Birthday!', time: 'Just now', likes: 24 },
  { id: '2', author: 'Forever Yours 💕', text: 'Can not wait to make a million more memories with you!', time: '2m ago', likes: 18 },
  { id: '3', author: 'Secret Admirer 🌸', text: 'That smile literally lights up the entire room. Never stop smiling!', time: '10m ago', likes: 42 },
  { id: '4', author: 'Best Friend 💖', text: 'Wishing you the happiest birthday ever! Love you to the moon and back!', time: '1h ago', likes: 19 },
];

export const LoveNotesModal: React.FC<LoveNotesModalProps> = ({ isOpen, onClose, recipientName }) => {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const newEntry: Note = {
      id: Date.now().toString(),
      author: authorName.trim() || 'Love Note 💌',
      text: newComment.trim(),
      time: 'Just now',
      likes: 1,
    };

    setNotes([newEntry, ...notes]);
    setNewComment('');
  };

  const handleLike = (id: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, likes: n.likes + 1 } : n));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="flex h-[100dvh] max-h-[100dvh] w-full max-w-md flex-col overflow-hidden border-pink-200 bg-white/95 shadow-2xl sm:h-auto sm:max-h-[85vh] sm:rounded-3xl sm:border"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-pink-100 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 px-4 py-3 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-6 sm:py-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-pink-500" />
                <h3 className="font-serif text-xl font-bold text-gray-800">
                  Sweet notes & wishes
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close notes"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-pink-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Notes List */}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 custom-scrollbar sm:p-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3.5 rounded-2xl bg-pink-50/60 border border-pink-100/80 hover:border-pink-200 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-pink-900">{note.author}</span>
                    <span className="text-xs text-pink-400">{note.time}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{note.text}</p>
                  <div className="mt-2 flex items-center justify-end">
                    <button
                      onClick={() => handleLike(note.id)}
                      className="flex items-center gap-1 text-xs text-pink-600 hover:text-pink-700 active:scale-110 transition-transform"
                    >
                      <Heart size={13} className="fill-pink-500 text-pink-500" />
                      <span>{note.likes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add note input */}
            <form onSubmit={handleAddComment} className="shrink-0 border-t border-pink-100 bg-pink-50/40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
              <input
                type="text"
                placeholder="Your name or nickname..."
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="mb-2 min-h-11 w-full scroll-mt-4 rounded-lg border border-pink-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-pink-400 focus:outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Write a sweet birthday note for ${recipientName}...`}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-11 min-w-0 flex-1 scroll-mt-4 rounded-xl border border-pink-200 bg-white px-3.5 py-2 text-sm text-gray-800 focus:border-pink-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 font-medium text-white shadow-md shadow-pink-500/20 transition-all hover:from-pink-600 hover:to-rose-600 disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
