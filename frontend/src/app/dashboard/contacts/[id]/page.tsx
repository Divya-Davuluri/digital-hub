'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Mail, Phone, Building, Calendar, Info, RefreshCw,
  Plus, Tag, Check, Play, Edit, Trash2, X, Award, Send, MessageSquare,
  Clock, Shield, User, FileText, ChevronRight, Activity
} from 'lucide-react';

interface PageProps {
  params: {
    id: string;
  };
}

export default function ContactDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const contactId = params.id;

  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes' | 'emails' | 'workflows'>('timeline');

  // Notes state
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Tags state
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  useEffect(() => {
    loadContactDetails();
  }, [contactId]);

  const loadContactDetails = async () => {
    setLoading(true);
    try {
      const res = await apiCall(`/contacts/${contactId}`);
      if (res?.success) {
        setContact(res.data);
      } else {
        toast.error('Contact details not found');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load contact details');
    } finally {
      setLoading(false);
    }
  };

  // Convert Lead action
  const handleMarkConverted = async () => {
    try {
      const res = await apiCall(`/contacts/${contactId}/convert`, { method: 'POST' });
      if (res?.success) {
        toast.success('Lead converted successfully!');
        // Reload details to sync notes, emails, and activities from database
        await loadContactDetails();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to convert lead');
    }
  };

  // Notes actions
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setIsSubmittingNote(true);
    try {
      const res = await apiCall(`/contacts/${contactId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content: noteContent })
      });

      if (res?.success) {
        toast.success('Note added successfully!');
        setNoteContent('');
        // Reload details to sync notes and activities
        await loadContactDetails();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteContent.trim()) return;

    try {
      const res = await apiCall(`/contacts/${contactId}/notes/${noteId}`, {
        method: 'PUT',
        body: JSON.stringify({ content: editingNoteContent })
      });

      if (res?.success) {
        toast.success('Note updated successfully!');
        setEditingNoteId(null);
        setEditingNoteContent('');
        await loadContactDetails();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const res = await apiCall(`/contacts/${contactId}/notes/${noteId}`, {
        method: 'DELETE'
      });

      if (res?.success) {
        toast.success('Note deleted successfully!');
        await loadContactDetails();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete note');
    }
  };

  // Tags action
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;

    try {
      const res = await apiCall(`/contacts/${contactId}/tag`, {
        method: 'POST',
        body: JSON.stringify({ tag: newTag.trim() })
      });

      if (res?.success) {
        toast.success('Tag added successfully!');
        setNewTag('');
        setIsAddingTag(false);
        await loadContactDetails();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add tag');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <div className="flex flex-col items-center justify-center flex-1 space-y-4">
            <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-slate-600 font-medium animate-pulse">Loading CRM details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <div className="flex flex-col items-center justify-center flex-1 p-6 text-center space-y-4">
            <div className="p-4 bg-red-50 text-red-500 rounded-full">
              <Info className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Contact Details Not Found</h2>
            <p className="text-slate-500 max-w-sm">
              We couldn't locate the contact record you requested. The record may have been deleted, or resides outside your workspace access scope.
            </p>
            <button
              onClick={() => router.push('/dashboard/contacts')}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Contacts List</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Parse tags list
  const tagsList = contact.tags ? contact.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-[260px] overflow-hidden">
        <Header />
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          
          {/* Header Actions Navigation */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <button
              onClick={() => router.push('/dashboard/contacts')}
              className="inline-flex items-center space-x-2 text-slate-500 hover:text-indigo-600 font-medium transition duration-200 group w-fit"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span>Back to Contacts CRM</span>
            </button>
            
            <div className="flex items-center space-x-3">
              {contact.status !== 'converted' ? (
                <button
                  onClick={handleMarkConverted}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition duration-200"
                >
                  <Award className="w-5 h-5 animate-bounce" />
                  <span>Convert Lead</span>
                </button>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-lg text-sm shadow-sm">
                  <Check className="w-4 h-4" />
                  <span>Lead Converted</span>
                </span>
              )}
            </div>
          </div>

          {/* 2-Column CRM Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* LEFT PROFILE CARD (1-Column Span) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              {/* Card Banner Profile */}
              <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-b border-slate-200 flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-black shadow-md border-4 border-white">
                    {contact.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-1 bg-white border border-slate-200 rounded-full shadow-sm">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">{contact.name}</h2>
                  <p className="text-slate-500 font-medium text-sm">{contact.company || 'Individual Contributor'}</p>
                </div>

                {/* Badges details grid */}
                <div className="flex flex-wrap gap-2 items-center justify-center">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full border tracking-wide uppercase ${
                    contact.status === 'converted'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : contact.status === 'new'
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    {contact.status}
                  </span>
                  
                  <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 border border-slate-200 text-slate-600 rounded-full tracking-wide">
                    Score: {contact.leadScore}
                  </span>
                </div>
              </div>

              {/* Profile Details List */}
              <div className="p-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Metadata</h3>
                
                <div className="space-y-3.5 text-sm">
                  {/* Email */}
                  <div className="flex items-center space-x-3 text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium truncate">{contact.email}</span>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center space-x-3 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium">{contact.phone || 'No phone recorded'}</span>
                  </div>

                  {/* Company */}
                  <div className="flex items-center space-x-3 text-slate-600">
                    <Building className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium">{contact.company || 'Not specified'}</span>
                  </div>

                  {/* Source */}
                  <div className="flex items-center space-x-3 text-slate-600">
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium">Source: <span className="capitalize">{contact.source || 'Manual'}</span></span>
                  </div>

                  {/* Created At */}
                  <div className="flex items-center space-x-3 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium">
                      Created: {new Date(contact.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Workspace Isolation check */}
                  <div className="flex items-center space-x-3 text-slate-600 pt-2 border-t border-slate-100">
                    <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-500">
                      Workspace Scope: {contact.workspaceId || 'Default'}
                    </span>
                  </div>
                </div>

                {/* Tags segment */}
                <div className="pt-5 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Workspace Tags</h3>
                    {!isAddingTag && (
                      <button
                        onClick={() => setIsAddingTag(true)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>

                  {isAddingTag && (
                    <form onSubmit={handleAddTag} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Tag name..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="flex-1 text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsAddingTag(false); setNewTag(''); }}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  )}

                  {tagsList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {tagsList.map((tag: string, index: number) => (
                        <span key={index} className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold border border-slate-200">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No tags associated with contact</p>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT WORKPLACE TAB PANELS (2-Column Span) */}
            <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
              
              {/* Tab Navigation header */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-200 bg-slate-50/50 p-2">
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition duration-200 ${
                      activeTab === 'timeline'
                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Timeline & Activities</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition duration-200 ${
                      activeTab === 'notes'
                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Notes</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-bold text-slate-500">
                      {contact.notes?.length || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('emails')}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition duration-200 ${
                      activeTab === 'emails'
                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    <span>Emails Logs</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-bold text-slate-500">
                      {contact.emails?.length || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('workflows')}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition duration-200 ${
                      activeTab === 'workflows'
                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    <span>Active Automations</span>
                  </button>
                </div>

                {/* TAB CONTENT SPACE */}
                <div className="p-6">
                  
                  {/* TAB 1: ACTIVITY TIMELINE */}
                  {activeTab === 'timeline' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-800">Chronological Activity Timeline</h3>
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">sequence log</span>
                      </div>

                      {contact.activities && contact.activities.length > 0 ? (
                        <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 ml-3 py-2">
                          {contact.activities.map((act: any, idx: number) => {
                            const type = act.activityType || act.type;
                            const message = act.activityMessage || act.description;
                            const title = act.activityType
                              ? act.activityType.replace('_', ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                              : act.title || 'Activity Event';

                            let iconColor = 'bg-blue-100 border-blue-200 text-blue-600';
                            if (type === 'lead_converted') iconColor = 'bg-emerald-100 border-emerald-200 text-emerald-600';
                            if (type === 'workflow_started') iconColor = 'bg-indigo-100 border-indigo-200 text-indigo-600';
                            if (type === 'email_sent') iconColor = 'bg-amber-100 border-amber-200 text-amber-600';
                            if (type === 'tags_updated') iconColor = 'bg-teal-100 border-teal-200 text-teal-600';
                            if (type === 'note_added') iconColor = 'bg-violet-100 border-violet-200 text-violet-600';

                            return (
                              <div key={act.id || idx} className="relative group">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-full border flex items-center justify-center text-xs shadow-sm ${iconColor}`}>
                                  {type === 'lead_converted' ? <Award className="w-3 h-3" /> :
                                   type === 'workflow_started' ? <Play className="w-3 h-3" /> :
                                   type === 'email_sent' ? <Send className="w-3 h-3" /> :
                                   type === 'note_added' ? <MessageSquare className="w-3 h-3" /> :
                                   <Clock className="w-3 h-3" />}
                                </div>

                                <div className="space-y-1">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm">
                                    <h4 className="font-bold text-slate-800">{title}</h4>
                                    <span className="text-xs text-slate-400 font-medium">
                                      {new Date(act.createdAt).toLocaleString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  {message && (
                                    <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                          <div className="p-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-full">
                            <Activity className="w-8 h-8" />
                          </div>
                          <p className="text-slate-500 font-medium text-sm">No recorded activities for this contact.</p>
                          <p className="text-xs text-slate-400">Core CRM events and automation logs will appear here.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: NOTES CRUD */}
                  {activeTab === 'notes' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-800">Workspace CRM Notes</h3>
                        <span className="text-xs text-slate-400">Collaborative journals</span>
                      </div>

                      {/* Create Note Input Form */}
                      <form onSubmit={handleAddNote} className="space-y-3 bg-slate-50 p-4 border border-slate-200 rounded-lg">
                        <textarea
                          placeholder="Type contact details, call summary, meeting notes, or tasks here..."
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          rows={3}
                          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={isSubmittingNote || !noteContent.trim()}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition duration-200"
                          >
                            <Plus className="w-4 h-4" />
                            <span>{isSubmittingNote ? 'Saving...' : 'Add Note'}</span>
                          </button>
                        </div>
                      </form>

                      {/* Notes list */}
                      {contact.notes && contact.notes.length > 0 ? (
                        <div className="space-y-4">
                          {contact.notes.map((note: any) => (
                            <div key={note.id} className="p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 shadow-sm transition duration-200 space-y-3">
                              {editingNoteId === note.id ? (
                                <div className="space-y-3">
                                  <textarea
                                    value={editingNoteContent}
                                    onChange={(e) => setEditingNoteContent(e.target.value)}
                                    rows={3}
                                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateNote(note.id)}
                                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setEditingNoteId(null); setEditingNoteContent(''); }}
                                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-semibold"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-0.5">
                                      <span className="font-bold text-sm text-slate-800">{note.createdByName || 'Team Member'}</span>
                                      <p className="text-slate-400 text-xs font-medium">
                                        {new Date(note.createdAt).toLocaleString(undefined, {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      <button
                                        type="button"
                                        onClick={() => { setEditingNoteId(note.id); setEditingNoteContent(note.content); }}
                                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded transition duration-150"
                                        title="Edit Note"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteNote(note.id)}
                                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-red-600 rounded transition duration-150"
                                        title="Delete Note"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                          <div className="p-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-full">
                            <MessageSquare className="w-6 h-6" />
                          </div>
                          <p className="text-slate-500 font-medium text-sm">No internal notes created yet.</p>
                          <p className="text-xs text-slate-400">Use the form above to add meeting summaries or collaborative tasks.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: EMAILS LOGS */}
                  {activeTab === 'emails' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-800">Email Outbox Logs</h3>
                        <span className="text-xs text-slate-400">Communication log archiving</span>
                      </div>

                      {contact.emails && contact.emails.length > 0 ? (
                        <div className="space-y-4">
                          {contact.emails.map((email: any) => (
                            <div key={email.id} className="p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 shadow-sm transition duration-200 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-2">
                                <div className="space-y-0.5">
                                  <h4 className="font-bold text-slate-800">{email.subject}</h4>
                                  <p className="text-slate-400 text-xs font-semibold">
                                    To: {contact.email}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full uppercase tracking-wider">
                                    {email.status}
                                  </span>
                                  <span className="text-slate-400 text-xs font-medium">
                                    {new Date(email.sentAt).toLocaleString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                              <div className="p-3 bg-slate-50 border border-slate-150 rounded text-slate-600 text-xs font-medium whitespace-pre-wrap leading-relaxed">
                                {email.body}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                          <div className="p-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-full">
                            <Mail className="w-8 h-8" />
                          </div>
                          <p className="text-slate-500 font-medium text-sm">No email records found.</p>
                          <p className="text-xs text-slate-400">Automated notifications and sent marketing campaigns will be recorded here.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: AUTOMATION JOURNEYS */}
                  {activeTab === 'workflows' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-slate-800">Active Automation & Workflow History</h3>
                        <span className="text-xs text-slate-400">Marketing automation engine</span>
                      </div>

                      {contact.workflows && contact.workflows.length > 0 ? (
                        <div className="space-y-4">
                          {contact.workflows.map((flow: any) => (
                            <div key={flow.id} className="p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 shadow-sm transition duration-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                              <div className="space-y-1.5">
                                <div className="flex items-center space-x-2">
                                  <Play className="w-4 h-4 text-indigo-600 fill-indigo-600 animate-pulse" />
                                  <h4 className="font-bold text-slate-800 text-base">{flow.name}</h4>
                                </div>
                                <div className="space-y-1 text-slate-500 text-xs font-medium">
                                  <p>Current Execution Node: <span className="text-slate-700 font-semibold">{flow.currentStep}</span></p>
                                  {flow.completedAt && (
                                    <p>Finished At: {new Date(flow.completedAt).toLocaleString()}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 shrink-0">
                                <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full tracking-wide border ${
                                  flow.status === 'completed'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-indigo-50 border-indigo-200 text-indigo-700 animate-pulse'
                                }`}>
                                  {flow.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                          <div className="p-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-full">
                            <Play className="w-8 h-8" />
                          </div>
                          <p className="text-slate-500 font-medium text-sm">No workflow enrollments recorded.</p>
                          <p className="text-xs text-slate-400">Enroll the contact in workflows from the main contacts catalog list.</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
