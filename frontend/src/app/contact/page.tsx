'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
        toast.success('Your message has been sent successfully! 🎉');
        setFormData({ name: '', email: '', message: '' });
      } else {
        toast.error(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Contact Form error:', error);
      toast.error('Failed to submit the form. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error message when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-900 relative overflow-hidden font-sans">
      
      {/* Background abstract decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] bg-indigo-200/40 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[50%] h-[50%] bg-sky-200/30 blur-[130px] rounded-full" />
      </div>

      {/* Nav Section */}
      <header className="max-w-7xl w-full mx-auto px-6 sm:px-12 py-6 flex items-center justify-between border-b border-slate-100 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="text-xl font-black tracking-tight flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded rotate-45" />
          </div>
          <span className="text-slate-900">DigitalMarketing<span className="text-indigo-600">Hub</span></span>
        </Link>
        <Link href="/login" className="text-sm font-extrabold text-indigo-600 hover:text-indigo-800 transition-all">
          Sign In
        </Link>
      </header>

      {/* Hero / Main Section */}
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-5xl grid md:grid-cols-12 gap-8 items-center">
          
          {/* Info Side */}
          <div className="md:col-span-5 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-black text-indigo-600">
              ⚡ Connect with our Team
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              Let's build something <span className="text-indigo-600">extraordinary</span> together.
            </h1>
            <p className="text-slate-500 text-base leading-relaxed max-w-md mx-auto md:mx-0">
              Have questions about our marketing workflow tools or want to scale your SaaS brand? Fill in the details, and our automation engine will process your inquiry instantly.
            </p>
            <div className="space-y-4 pt-4 hidden md:block">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg text-indigo-600 font-bold">📍</div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Global Offices</p>
                  <p className="text-xs text-slate-400">San Francisco, CA & Remote</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg text-indigo-600 font-bold">📧</div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Direct Support</p>
                  <p className="text-xs text-indigo-600 font-bold">support@hubsaas.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="md:col-span-7 bg-white/80 backdrop-blur-lg border border-slate-200/60 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-100/50">
            {isSuccess ? (
              <div className="text-center py-12 space-y-5">
                <div className="w-20 h-20 bg-indigo-50 border-2 border-indigo-200 rounded-full flex items-center justify-center mx-auto text-4xl animate-bounce">
                  🎉
                </div>
                <h3 className="text-2xl font-black text-slate-900">Message Received!</h3>
                <p className="text-slate-500 max-w-sm mx-auto text-sm">
                  Thank you for reaching out. Our automated workflow engine has enrolled you and initiated your welcome email!
                </p>
                <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all"
                  >
                    Send Another Message
                  </button>
                  <Link
                    href="/"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-200 text-center transition-all"
                  >
                    Go Back Home
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-1.5">Contact Us</h3>
                  <p className="text-xs text-slate-400 font-medium">We usually respond within a few minutes via automation!</p>
                </div>

                <div className="space-y-4">
                  {/* Name field */}
                  <div>
                    <label htmlFor="name" className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1.5">Your Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Jane Doe"
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-100 transition-all ${
                        errors.name ? 'border-rose-400 focus:ring-rose-50' : 'border-slate-200 focus:border-indigo-500'
                      }`}
                    />
                    {errors.name && <p className="text-xs text-rose-500 font-bold mt-1">⚠️ {errors.name}</p>}
                  </div>

                  {/* Email field */}
                  <div>
                    <label htmlFor="email" className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1.5">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. jane@domain.com"
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-100 transition-all ${
                        errors.email ? 'border-rose-400 focus:ring-rose-50' : 'border-slate-200 focus:border-indigo-500'
                      }`}
                    />
                    {errors.name && errors.email && <div className="h-0" />}
                    {errors.email && <p className="text-xs text-rose-500 font-bold mt-1">⚠️ {errors.email}</p>}
                  </div>

                  {/* Message field */}
                  <div>
                    <label htmlFor="message" className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1.5">Your Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Write your inquiry details here..."
                      rows={5}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100 resize-none transition-all ${
                        errors.message ? 'border-rose-400 focus:ring-rose-50' : 'border-slate-200 focus:border-indigo-500'
                      }`}
                    />
                    {errors.message && <p className="text-xs text-rose-500 font-bold mt-1">⚠️ {errors.message}</p>}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Sending inquiry...</span>
                    </>
                  ) : (
                    <span>Submit Inquiry ⚡</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="w-full py-8 text-center text-xs text-slate-400 border-t border-slate-100 bg-white/30">
        <p>© {new Date().getFullYear()} Digital Marketing Hub. All rights reserved. Powered by Workflow Engine.</p>
      </footer>
    </main>
  );
}
