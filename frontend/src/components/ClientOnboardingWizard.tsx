import React, { useState, useEffect } from 'react';
import apiCall from '@/lib/api';

interface ClientOnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (client: any) => void;
}

export default function ClientOnboardingWizard({ isOpen, onClose, onSuccess }: ClientOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [createdClient, setCreatedClient] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    companyName: '',
    phone: '',
    plan: 'STARTER',
    assignedTeamMemberId: '',
    sendWelcomeEmail: true
  });

  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormData({
        fullName: '',
        email: '',
        companyName: '',
        phone: '',
        plan: 'STARTER',
        assignedTeamMemberId: '',
        sendWelcomeEmail: true
      });
      setError('');
      setEmailError('');
      setCreatedClient(null);
      fetchTeamMembers();
    }
  }, [isOpen]);

  const fetchTeamMembers = async () => {
    try {
      const data = await apiCall('/admin/team-members');
      setTeamMembers(data || []);
    } catch (err) {
      console.error('Failed to fetch team members', err);
    }
  };

  const checkEmail = async (email: string) => {
    if (!email || !email.includes('@')) return;
    setCheckingEmail(true);
    setEmailError('');
    try {
      const data = await apiCall(`/admin/onboarding/check-email?email=${encodeURIComponent(email)}`);
      if (data.exists) {
        setEmailError('Email already registered');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleNextStep1 = () => {
    setError('');
    if (!formData.fullName.trim() || formData.fullName.length < 2) {
      setError('Full Name is required and must be at least 2 characters.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('A valid Email Address is required.');
      return;
    }
    if (emailError) {
      setError('Please use a different email address.');
      return;
    }
    // Phone validation (very basic optional check)
    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      setError('Phone number contains invalid characters.');
      return;
    }
    setCurrentStep(2);
  };

  const handleCreateWorkspace = async () => {
    setError('');
    setLoading(true);
    try {
      setLoadingMessage('Creating user account...');
      await new Promise(r => setTimeout(r, 600)); // Simulate multi-step feel
      setLoadingMessage('Setting up workspace...');
      
      const response = await apiCall('/admin/onboarding/client', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to create workspace');
      }

      setLoadingMessage('Sending welcome email...');
      await new Promise(r => setTimeout(r, 400));
      
      setCreatedClient(response.client);
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Progress Bar */}
        <div style={{ display: 'flex', height: '4px', background: '#f3f4f6', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
          <div style={{ width: currentStep >= 1 ? '33.33%' : '0%', background: '#4f46e5', transition: 'width 0.3s ease' }} />
          <div style={{ width: currentStep >= 2 ? '33.33%' : '0%', background: '#4f46e5', transition: 'width 0.3s ease' }} />
          <div style={{ width: currentStep >= 3 ? '33.33%' : '0%', background: '#4f46e5', transition: 'width 0.3s ease' }} />
        </div>

        <div style={{ padding: '32px' }}>
          {/* Step Indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold',
                background: currentStep > 1 ? '#4f46e5' : currentStep === 1 ? 'white' : '#f3f4f6',
                color: currentStep > 1 ? 'white' : currentStep === 1 ? '#4f46e5' : '#9ca3af',
                border: currentStep === 1 ? '2px solid #4f46e5' : 'none'
              }}>1</div>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: currentStep >= 1 ? '#111827' : '#9ca3af' }}>Client Details</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold',
                background: currentStep > 2 ? '#4f46e5' : currentStep === 2 ? 'white' : '#f3f4f6',
                color: currentStep > 2 ? 'white' : currentStep === 2 ? '#4f46e5' : '#9ca3af',
                border: currentStep === 2 ? '2px solid #4f46e5' : 'none'
              }}>2</div>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: currentStep >= 2 ? '#111827' : '#9ca3af' }}>Access & Plan</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold',
                background: currentStep === 3 ? '#4f46e5' : '#f3f4f6',
                color: currentStep === 3 ? 'white' : '#9ca3af',
                border: 'none'
              }}>3</div>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: currentStep === 3 ? '#111827' : '#9ca3af' }}>Complete</span>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '24px', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="animate-subtle-fade">
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '24px' }}>Client Information</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px' }}>Full Name *</label>
                  <input 
                    type="text" 
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    placeholder="e.g. John Doe"
                    disabled={loading}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px' }}>Email Address *</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={e => {
                        setFormData({...formData, email: e.target.value});
                        setEmailError('');
                      }}
                      onBlur={() => checkEmail(formData.email)}
                      placeholder="client@company.com"
                      disabled={loading}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${emailError ? '#ef4444' : '#e5e7eb'}`, fontSize: '14px', outline: 'none' }}
                    />
                    {checkingEmail && <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '12px', color: '#9ca3af' }}>Checking...</span>}
                  </div>
                  {emailError && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: 'bold' }}>{emailError}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px' }}>Company Name (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.companyName}
                    onChange={e => setFormData({...formData, companyName: e.target.value})}
                    placeholder="e.g. Acme Corp"
                    disabled={loading}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px' }}>Phone Number (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="+1 (555) 000-0000"
                    disabled={loading}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button 
                  onClick={onClose}
                  style={{ flex: 1, padding: '10px 24px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontWeight: 'bold', cursor: 'pointer' }}
                >Cancel</button>
                <button 
                  onClick={handleNextStep1}
                  disabled={loading || !!emailError}
                  style={{ flex: 1, padding: '10px 24px', background: '#4f46e5', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', opacity: (loading || !!emailError) ? 0.5 : 1 }}
                >Next →</button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="animate-subtle-fade">
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '24px' }}>Workspace Setup</h2>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: '12px' }}>Select Plan</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { id: 'STARTER', name: 'Starter', price: '$49/mo', desc: '3 clients' },
                    { id: 'GROWTH', name: 'Growth', price: '$149/mo', desc: '10 clients' },
                    { id: 'AGENCY_PRO', name: 'Agency Pro', price: '$349/mo', desc: 'Unlimited' },
                    { id: 'ENTERPRISE', name: 'Enterprise', price: 'Custom', desc: 'Unlimited' }
                  ].map(p => (
                    <div 
                      key={p.id}
                      onClick={() => !loading && setFormData({...formData, plan: p.id})}
                      style={{ 
                        border: formData.plan === p.id ? '2px solid #4f46e5' : '1px solid #e5e7eb',
                        background: formData.plan === p.id ? '#eef2ff' : 'white',
                        borderRadius: '12px', padding: '16px', cursor: loading ? 'default' : 'pointer',
                        transition: 'all 0.2s ease', opacity: loading ? 0.6 : 1
                      }}
                    >
                      <h4 style={{ fontWeight: 'bold', color: '#111827', fontSize: '14px', marginBottom: '4px' }}>{p.name}</h4>
                      <p style={{ color: '#4f46e5', fontWeight: '900', fontSize: '16px', marginBottom: '4px' }}>{p.price}</p>
                      <p style={{ color: '#6b7280', fontSize: '12px' }}>{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px' }}>Assign Team Member</label>
                <select 
                  value={formData.assignedTeamMemberId}
                  onChange={e => setFormData({...formData, assignedTeamMemberId: e.target.value})}
                  disabled={loading}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none', background: 'white' }}
                >
                  <option value="">Select team member (optional)</option>
                  {teamMembers.map(tm => (
                    <option key={tm.id} value={tm.id}>{tm.name} ({tm.email})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="checkbox" 
                  id="sendEmail" 
                  checked={formData.sendWelcomeEmail}
                  onChange={e => setFormData({...formData, sendWelcomeEmail: e.target.checked})}
                  disabled={loading}
                  style={{ width: '18px', height: '18px', accentColor: '#4f46e5' }}
                />
                <div>
                  <label htmlFor="sendEmail" style={{ display: 'block', fontWeight: 'bold', fontSize: '14px', color: '#111827' }}>Send welcome email to client</label>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>Client will receive login credentials via email</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button 
                  onClick={() => setCurrentStep(1)}
                  disabled={loading}
                  style={{ flex: 1, padding: '10px 24px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
                >← Back</button>
                <button 
                  onClick={handleCreateWorkspace}
                  disabled={loading}
                  style={{ flex: 1, padding: '10px 24px', background: '#4f46e5', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.8 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  {loading ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <span>{loadingMessage || 'Creating...'}</span>
                    </>
                  ) : (
                    'Create Workspace →'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && createdClient && (
            <div className="animate-subtle-fade text-center">
              <div style={{ width: '64px', height: '64px', background: '#d1fae5', color: '#059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px' }}>
                ✓
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '24px' }}>Workspace Created Successfully!</h2>
              
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'left', marginBottom: '24px' }}>
                <div style={{ marginBottom: '8px', fontSize: '14px' }}><strong>👤 Name:</strong> {createdClient.name}</div>
                <div style={{ marginBottom: '8px', fontSize: '14px' }}><strong>📧 Email:</strong> {createdClient.email}</div>
                {formData.companyName && <div style={{ marginBottom: '8px', fontSize: '14px' }}><strong>🏢 Company:</strong> {formData.companyName}</div>}
                <div style={{ marginBottom: '8px', fontSize: '14px' }}><strong>📋 Plan:</strong> <span style={{ textTransform: 'capitalize' }}>{createdClient.plan.replace('_', ' ').toLowerCase()}</span></div>
                <div style={{ marginBottom: '8px', fontSize: '14px' }}><strong>🔑 Temp Password:</strong> <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', color: '#0f172a' }}>{createdClient.temporaryPassword}</code></div>
                <div style={{ fontSize: '14px' }}><strong>🔗 Login URL:</strong> {createdClient.loginUrl}</div>
              </div>

              <div style={{ background: '#fef3c7', color: '#92400e', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '32px', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <strong>Save the temporary password now. It will not be shown again.</strong>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => {
                    setCreatedClient(null);
                    setCurrentStep(1);
                    setFormData({
                      fullName: '', email: '', companyName: '', phone: '', plan: 'STARTER', assignedTeamMemberId: '', sendWelcomeEmail: true
                    });
                  }}
                  style={{ flex: 1, padding: '10px 24px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontWeight: 'bold', cursor: 'pointer' }}
                >Add Another Client</button>
                <button 
                  onClick={() => onSuccess(createdClient)}
                  style={{ flex: 1, padding: '10px 24px', background: '#4f46e5', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                >View Client Dashboard →</button>
              </div>
            </div>
          )}

        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
