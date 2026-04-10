import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');
    try {
      const res = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('Message sent successfully!');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus(data.error || 'Failed to send message.');
      }
    } catch (err) {
      setStatus('Network error. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-start">
      <div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-700 drop-shadow-sm tracking-tight mb-4">Get in Touch</h1>
        <p className="text-lg text-textSecondary mb-10">Have questions regarding courses, admissions, or institutional policies? Our academic reception is ready to assist you.</p>

        <div className="space-y-8">
          <div className="flex items-start gap-4 p-6 rounded-2xl bg-surface border border-border/50 shadow-sm">
            <span className="text-3xl mt-1 text-primary">📍</span>
            <div>
              <h3 className="text-lg font-bold text-textPrimary">Main Campus</h3>
              <p className="text-textSecondary mt-1 leading-relaxed">
                Smart OS Tech Park, Block A<br/>
                Innovation City<br/>
                Bangalore, 560070
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-6 rounded-2xl bg-surface border border-border/50 shadow-sm">
            <span className="text-3xl mt-1 text-accent">📧</span>
            <div>
              <h3 className="text-lg font-bold text-textPrimary">Email Us</h3>
              <p className="text-textSecondary mt-1">admissions@smartcampus.edu</p>
              <p className="text-textSecondary">support@smartcampus.edu</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border/50 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <h3 className="text-2xl font-bold text-textPrimary mb-6 relative z-10">Send a Message</h3>
        {status && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${status.includes('successfully') ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
            {status}
          </div>
        )}
        <form className="space-y-5 relative z-10" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-textPrimary ml-1 mb-1 block">Full Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              className="w-full px-5 py-3.5 bg-background border border-border/50 rounded-xl text-foreground placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary/50" 
              placeholder="John Doe" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-textPrimary ml-1 mb-1 block">Email Address</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              className="w-full px-5 py-3.5 bg-background border border-border/50 rounded-xl text-foreground placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary/50" 
              placeholder="john@example.com" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-textPrimary ml-1 mb-1 block">Message</label>
            <textarea 
              rows="4" 
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              required
              className="w-full px-5 py-3.5 bg-background border border-border/50 rounded-xl text-foreground placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary/50" 
              placeholder="How can we help?"
            ></textarea>
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            Submit Inquiry
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
