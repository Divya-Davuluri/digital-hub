'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import toast from 'react-hot-toast';
import {
  Plus, Search, Filter, Tag, Check, Award, Play, Edit, Trash2,
  Eye, X, Mail, Phone, Building, Calendar, Info, RefreshCw, AlertCircle
} from 'lucide-react';

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalContacts: 0,
    newLeads: 0,
    enrolledLeads: 0,
    convertedLeads: 0
  });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [workflowStatusFilter, setWorkflowStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Selected Contact for Modal Actions
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formSource, setFormSource] = useState('manual');
  const [formStatus, setFormStatus] = useState('new');
  const [formLeadScore, setFormLeadScore] = useState(10);
  const [formTags, setFormTags] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formAssignedTeamMemberId, setFormAssignedTeamMemberId] = useState('');

  // Tag Form Field
  const [newTag, setNewTag] = useState('');
  const [isTagOpen, setIsTagOpen] = useState(false);

  // Selected Workflow for Enrollment
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');

  // Initial Data Load
  useEffect(() => {
    loadContacts();
    loadWorkflows();
    loadTeamMembers();
  }, [search, statusFilter, workflowStatusFilter, sourceFilter, page, limit]);

  const loadTeamMembers = async () => {
    try {
      const res = await apiCall('/agency/team-members');
      setTeamMembers(res || []);
    } catch (err) {}
  };

  const loadContacts = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (workflowStatusFilter) params.append('workflowStatus', workflowStatusFilter);
      if (sourceFilter) params.append('source', sourceFilter);
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());

      const res = await apiCall(`/contacts?${params.toString()}`);
      if (res?.success) {
        setContacts(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
        setStats(res.stats || {
          totalContacts: 0,
          newLeads: 0,
          enrolledLeads: 0,
          convertedLeads: 0
        });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflows = async () => {
    try {
      const res = await apiCall('/workflows');
      const data = res?.data || res || [];
      // Keep only active workflows
      setWorkflows(Array.isArray(data) ? data.filter((w: any) => w.status === 'active') : []);
    } catch (err) {}
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      return toast.error('Name and Email are required fields.');
    }

    try {
      const payload = {
        name: formName,
        email: formEmail,
        phone: formPhone,
        company: formCompany,
        source: formSource,
        status: formStatus,
        leadScore: formLeadScore,
        tags: formTags,
        message: formMessage,
        assignedTeamMemberId: formAssignedTeamMemberId || null
      };

      const res = await apiCall('/contacts', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res?.success) {
        toast.success('Contact created successfully!');
        setIsCreateOpen(false);
        resetForm();
        loadContacts();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create contact');
    }
  };

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      return toast.error('Name and Email are required fields.');
    }

    try {
      const payload = {
        name: formName,
        email: formEmail,
        phone: formPhone,
        company: formCompany,
        source: formSource,
        status: formStatus,
        leadScore: formLeadScore,
        tags: formTags,
        message: formMessage,
        assignedTeamMemberId: formAssignedTeamMemberId || null
      };

      const res = await apiCall(`/contacts/${selectedContact.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res?.success) {
        toast.success('Contact updated successfully!');
        setIsEditOpen(false);
        setSelectedContact(res.data);
        resetForm();
        loadContacts();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update contact');
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this contact?')) return;

    try {
      const res = await apiCall(`/contacts/${id}`, { method: 'DELETE' });
      if (res?.success) {
        toast.success('Contact deleted successfully!');
        setIsViewOpen(false);
        loadContacts();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete contact');
    }
  };

  const handleMarkConverted = async (id: string) => {
    try {
      const res = await apiCall(`/contacts/${id}/convert`, { method: 'POST' });
      if (res?.success) {
        toast.success('Contact marked as converted!');
        loadContacts();
        if (selectedContact && selectedContact.id === id) {
          setSelectedContact({ ...selectedContact, status: 'converted', leadScore: selectedContact.leadScore + 40 });
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to mark contact as converted');
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return toast.error('Tag text cannot be empty');

    try {
      const res = await apiCall(`/contacts/${selectedContact.id}/tag`, {
        method: 'POST',
        body: JSON.stringify({ tag: newTag })
      });

      if (res?.success) {
        toast.success('Tag added successfully!');
        setSelectedContact({ ...selectedContact, tags: res.tags });
        setNewTag('');
        setIsTagOpen(false);
        loadContacts();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add tag');
    }
  };

  const handleEnrollInWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflowId) return toast.error('Please select a workflow to enroll');

    try {
      const res = await apiCall(`/contacts/${selectedContact.id}/enroll`, {
        method: 'POST',
        body: JSON.stringify({ workflowId: selectedWorkflowId })
      });

      if (res?.success) {
        const workflowName = workflows.find(w => w.id === selectedWorkflowId)?.name || 'Workflow';
        toast.success(`Successfully enrolled contact in ${workflowName}!`);
        setIsEnrollOpen(false);
        setSelectedWorkflowId('');
        loadContacts();
        // Refresh detail view
        setSelectedContact({
          ...selectedContact,
          workflowId: selectedWorkflowId,
          workflowStatus: 'enrolled'
        });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to enroll contact');
    }
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditModal = (contact: any) => {
    setSelectedContact(contact);
    setFormName(contact.name || '');
    setFormEmail(contact.email || '');
    setFormPhone(contact.phone || '');
    setFormCompany(contact.company || '');
    setFormSource(contact.source || 'manual');
    setFormStatus(contact.status || 'new');
    setFormLeadScore(contact.leadScore || 0);
    setFormTags(contact.tags || '');
    setFormMessage(contact.message || '');
    setFormAssignedTeamMemberId(contact.assignedTeamMemberId || '');
    setIsEditOpen(true);
  };

  const openViewModal = (contact: any) => {
    setSelectedContact(contact);
    setIsViewOpen(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormCompany('');
    setFormSource('manual');
    setFormStatus('new');
    setFormLeadScore(10);
    setFormTags('');
    setFormMessage('');
    setFormAssignedTeamMemberId('');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-[260px]">
        <Header />
        <main className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">CRM Contacts</h1>
              <p className="text-slate-500 mt-1">Manage leads, track statuses, and trigger automations.</p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <Plus size={18} />
              Add Contact
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Contacts" value={stats.totalContacts} subtext="contacts" icon={<Building size={20} />} color="slate" />
            <StatCard title="New Leads" value={stats.newLeads} subtext="leads" icon={<Info size={20} />} color="emerald" />
            <StatCard title="Enrolled" value={stats.enrolledLeads} subtext="active flows" icon={<Play size={20} />} color="indigo" />
            <StatCard title="Converted" value={stats.convertedLeads} subtext="customers" icon={<Award size={20} />} color="amber" />
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-[24px] border border-slate-100 p-6 mb-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-slate-900"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              {/* Workflow Status Filter */}
              <div className="relative">
                <select
                  value={workflowStatusFilter}
                  onChange={(e) => setWorkflowStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700 bg-white"
                >
                  <option value="">All Workflow States</option>
                  <option value="enrolled">Enrolled</option>
                  <option value="completed">Completed</option>
                  <option value="none">Not Enrolled</option>
                </select>
              </div>

              {/* Source Filter */}
              <div className="relative">
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-700 bg-white"
                >
                  <option value="">All Sources</option>
                  <option value="contact_form">Contact Form</option>
                  <option value="manual">Manual Entry</option>
                  <option value="newsletter">Newsletter</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table list */}
          {loading ? (
            <div className="bg-white rounded-[32px] border border-slate-100 p-24 text-center shadow-sm flex flex-col items-center justify-center gap-4">
              <RefreshCw className="animate-spin text-indigo-600" size={36} />
              <p className="text-slate-500 font-medium">Fetching active leads...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="bg-white rounded-[32px] border border-slate-100 p-20 text-center shadow-sm">
              <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">No contacts found</h3>
              <p className="text-slate-500 mt-2 mb-8 max-w-md mx-auto">No contact entries match your filter settings. Create one or submit your public Contact Form.</p>
              <button
                onClick={openCreateModal}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Create Contact
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Name</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Email</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Source</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Lead Score</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Workflow State</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Created Date</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {contacts.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td 
                          onClick={() => router.push(`/dashboard/contacts/${c.id}`)}
                          className="py-4 px-6 font-bold text-slate-900 text-sm cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="hover:text-indigo-600 transition-colors">{c.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {c.company && <span className="text-xs text-slate-400 font-medium">{c.company}</span>}
                              {c.assignedTeamMemberName && (
                                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-black">
                                  👤 {c.assignedTeamMemberName}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-medium text-sm">{c.email}</td>
                        <td className="py-4 px-6 text-sm font-bold text-slate-400">
                          <span className="capitalize">{c.source?.replace('_', ' ')}</span>
                        </td>
                        <td className="py-4 px-6">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 font-black text-slate-800 text-sm">
                            <Award size={15} className="text-amber-500" />
                            {c.leadScore}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <WorkflowStatusBadge status={c.workflowStatus} />
                        </td>
                        <td className="py-4 px-6 text-xs font-bold text-slate-400">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => router.push(`/dashboard/contacts/${c.id}`)}
                              title="View Details"
                              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openEditModal(c)}
                              title="Edit"
                              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-amber-600 transition-all"
                            >
                              <Edit size={16} />
                            </button>
                            {c.status !== 'converted' && (
                              <button
                                onClick={() => handleMarkConverted(c.id)}
                                title="Mark Converted"
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-emerald-600 transition-all"
                              >
                                <Check size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteContact(c.id)}
                              title="Delete"
                              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-rose-600 transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                <span className="text-sm text-slate-500 font-medium">
                  Showing page {page} of {totalPages || 1}
                </span>
                <div className="flex gap-2">
                  <button 
                    disabled={page <= 1} 
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors bg-white shadow-sm"
                  >
                    Previous
                  </button>
                  <button 
                    disabled={page >= totalPages} 
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors bg-white shadow-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* VIEW CONTACT DETAILS MODAL */}
      {isViewOpen && selectedContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-black">
                  {selectedContact.name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedContact.name}</h2>
                  <p className="text-xs text-slate-400 font-medium">Contact Details Overview</p>
                </div>
              </div>
              <button
                onClick={() => setIsViewOpen(false)}
                className="p-2 hover:bg-white rounded-full transition-colors border border-slate-100 shadow-sm"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-6">
              {/* Cards Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-start gap-3">
                  <Mail className="text-indigo-600 mt-0.5" size={18} />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedContact.email}</p>
                  </div>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-start gap-3">
                  <Phone className="text-indigo-600 mt-0.5" size={18} />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedContact.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-start gap-3">
                  <Building className="text-indigo-600 mt-0.5" size={18} />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company / Biz</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedContact.company || 'Not provided'}</p>
                  </div>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-start gap-3">
                  <Calendar className="text-indigo-600 mt-0.5" size={18} />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Created Date</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                      {selectedContact.createdAt ? new Date(selectedContact.createdAt).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-start gap-3 col-span-2">
                  <Info className="text-indigo-600 mt-0.5" size={18} />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Team Member</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                      {selectedContact.assignedTeamMemberName 
                        ? `👤 ${selectedContact.assignedTeamMemberName}`
                        : 'Unassigned (No team member)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status and Automations */}
              <div className="bg-indigo-50/40 rounded-2xl p-6 border border-indigo-100/50 space-y-4">
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest mb-2">Lead Scoring & Automation State</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Lead score</p>
                    <div className="flex items-center gap-1.5 font-black text-indigo-700 text-lg mt-1">
                      <Award size={18} className="text-indigo-600" />
                      {selectedContact.leadScore} pts
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Contact Status</p>
                    <div className="mt-1">
                      <StatusBadge status={selectedContact.status} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Automation sync</p>
                    <div className="mt-1">
                      <WorkflowStatusBadge status={selectedContact.workflowStatus} />
                    </div>
                  </div>
                </div>

                {selectedContact.workflowId && (
                  <div className="pt-4 border-t border-indigo-100 flex items-center justify-between text-xs font-bold text-indigo-800">
                    <span>Enrolled In Workflow ID:</span>
                    <span className="font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{selectedContact.workflowId}</span>
                  </div>
                )}
              </div>

              {/* Tags Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Contact Tags</label>
                  <button
                    onClick={() => setIsTagOpen(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Tag
                  </button>
                </div>
                {isTagOpen && (
                  <form onSubmit={handleAddTag} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="e.g. VIP, Warm"
                      value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-50 outline-none w-full"
                    />
                    <button type="submit" className="bg-slate-900 text-white px-3 rounded-lg text-xs font-bold hover:bg-indigo-600 transition-all">Add</button>
                    <button type="button" onClick={() => setIsTagOpen(false)} className="px-2 border rounded-lg text-slate-400 text-xs hover:bg-slate-50">Cancel</button>
                  </form>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {selectedContact.tags ? (
                    selectedContact.tags.split(',').map((tag: string, index: number) => (
                      <span key={index} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Tag size={12} className="text-slate-400" />
                        {tag.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No tags assigned.</span>
                  )}
                </div>
              </div>

              {/* Form Message */}
              {selectedContact.message && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Message history</label>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 font-medium text-slate-600 text-sm">
                    "{selectedContact.message}"
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button
                onClick={() => setIsEnrollOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-100"
              >
                <Play size={14} /> Enroll in Workflow
              </button>
              {selectedContact.status !== 'converted' && (
                <button
                  onClick={() => handleMarkConverted(selectedContact.id)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs px-4 py-3 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Check size={14} /> Mark Converted
                </button>
              )}
              <button
                onClick={() => openEditModal(selectedContact)}
                className="bg-white border hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-3 rounded-xl transition-all flex items-center gap-1.5 ml-auto"
              >
                <Edit size={14} /> Edit
              </button>
              <button
                onClick={() => handleDeleteContact(selectedContact.id)}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs px-4 py-3 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CONTACT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsCreateOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full"><X size={24} /></button>
            <h2 className="text-2xl font-black text-slate-900 mb-1">New Contact</h2>
            <p className="text-slate-500 mb-6 text-sm font-medium">Add a new lead record to the CRM database.</p>

            <form onSubmit={handleCreateContact} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="e.g. john@company.com"
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="e.g. +123456789"
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Company</label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={e => setFormCompany(e.target.value)}
                    placeholder="e.g. ACME Corp"
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Lead Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value)}
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900 bg-white"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Source</label>
                  <select
                    value={formSource}
                    onChange={e => setFormSource(e.target.value)}
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900 bg-white"
                  >
                    <option value="manual">Manual Entry</option>
                    <option value="contact_form">Contact Form</option>
                    <option value="newsletter">Newsletter</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Assigned Team Member</label>
                <select
                  value={formAssignedTeamMemberId}
                  onChange={e => setFormAssignedTeamMemberId(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900 bg-white"
                >
                  <option value="">Unassigned (No team member)</option>
                  {teamMembers.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={e => setFormTags(e.target.value)}
                  placeholder="e.g. VIP, Warm Lead"
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Message / Notes</label>
                <textarea
                  value={formMessage}
                  onChange={e => setFormMessage(e.target.value)}
                  rows={2}
                  placeholder="Add any context or form submission message details..."
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-slate-900 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 py-3.5 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Create Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CONTACT MODAL */}
      {isEditOpen && selectedContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsEditOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full"><X size={24} /></button>
            <h2 className="text-2xl font-black text-slate-900 mb-1">Edit Contact</h2>
            <p className="text-slate-500 mb-6 text-sm font-medium">Modify contact and lead tracking parameters.</p>

            <form onSubmit={handleUpdateContact} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="e.g. john@company.com"
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="e.g. +123456789"
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Company</label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={e => setFormCompany(e.target.value)}
                    placeholder="e.g. ACME Corp"
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Lead Score</label>
                  <input
                    type="number"
                    value={formLeadScore}
                    onChange={e => setFormLeadScore(Number(e.target.value))}
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900 bg-white"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Source</label>
                  <select
                    value={formSource}
                    onChange={e => setFormSource(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900 bg-white"
                  >
                    <option value="manual">Manual Entry</option>
                    <option value="contact_form">Contact Form</option>
                    <option value="newsletter">Newsletter</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Assigned Team Member</label>
                <select
                  value={formAssignedTeamMemberId}
                  onChange={e => setFormAssignedTeamMemberId(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900 bg-white"
                >
                  <option value="">Unassigned (No team member)</option>
                  {teamMembers.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={e => setFormTags(e.target.value)}
                  placeholder="e.g. VIP, Warm Lead"
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Message / Notes</label>
                <textarea
                  value={formMessage}
                  onChange={e => setFormMessage(e.target.value)}
                  rows={2}
                  placeholder="Contact notes..."
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-slate-900 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditOpen(false)} className="flex-1 py-3.5 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WORKFLOW ENROLLMENT MODAL */}
      {isEnrollOpen && selectedContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl relative">
            <button onClick={() => setIsEnrollOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full"><X size={24} /></button>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Enroll Lead</h2>
            <p className="text-slate-500 mb-8 font-medium">Select an active marketing automation flow to enroll <strong>{selectedContact.name}</strong>.</p>

            <form onSubmit={handleEnrollInWorkflow} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Select Automation Flow</label>
                {workflows.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-100 text-amber-700 p-4 rounded-2xl text-sm font-bold text-center">
                    No active form automation workflows found. Please activate one in your automation dashboard first.
                  </div>
                ) : (
                  <select
                    value={selectedWorkflowId}
                    onChange={e => setSelectedWorkflowId(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900 bg-white"
                  >
                    <option value="">Select a sequence...</option>
                    {workflows.map(w => (
                      <option key={w.id} value={w.id}>{w.name} (Trigger: {w.triggerType})</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEnrollOpen(false)} className="flex-1 py-3.5 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-all">Cancel</button>
                <button
                  type="submit"
                  disabled={workflows.length === 0}
                  className={`flex-1 py-3.5 text-white rounded-2xl font-bold transition-all shadow-lg ${
                    workflows.length === 0 
                      ? 'bg-slate-300 shadow-none cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                  }`}
                >
                  Enroll Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, subtext, icon, color }: any) {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-50 text-slate-600',
  };
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <h2 className="text-3xl font-black text-slate-900">{value}</h2>
        <span className="text-xs font-bold text-slate-400 lowercase">{subtext}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    new:       'bg-blue-50 text-blue-600 border-blue-100',
    contacted: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    converted: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    lost:      'bg-slate-100 text-slate-400 border-slate-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border inline-flex items-center gap-1.5 ${styles[status] || styles.new}`}>
      {status === 'converted' && <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />}
      {status}
    </span>
  );
}

function WorkflowStatusBadge({ status }: { status: string }) {
  const styles: any = {
    enrolled:  'bg-indigo-50 text-indigo-600 border-indigo-100',
    completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    none:      'bg-slate-50 text-slate-400 border-slate-100',
  };
  
  const displayStatus = status || 'none';
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border inline-flex items-center gap-1.5 ${styles[displayStatus] || styles.none}`}>
      {displayStatus === 'enrolled' && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />}
      {displayStatus}
    </span>
  );
}
