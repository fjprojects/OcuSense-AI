import React, { useState } from 'react';
import { useToast } from './Toast';

const Contact = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    message: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!formData.name || !formData.email || !formData.message) {
      showToast('Please fill all fields', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Send to your Django API
      const response = await fetch('/api/contact/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast('✅ Message sent successfully!', 'success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        showToast('❌ Failed to send message. Please try again.', 'error');
      }
    } catch (error) {
      showToast('❌ Network error. Please check your connection.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="row gy-4">
      <div className="col-lg-6">
        <div className="glass-card p-5 mb-4">
          <p className="text-uppercase text-accent mb-3 small-note">Contact us</p>
          <h1 className="section-heading mb-3">Let's connect</h1>
          <p className="small-note">
            Send feedback, request a demo, or ask about improvements for the EyeCare AI project.
          </p>
        </div>

        <div className="glass-card p-4">
          <h5 className="mb-3">Contact form</h5>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="name" className="form-label text-white-75">Name</label>
              <input
                type="text"
                id="name"
                className="form-control bg-transparent text-white border-light"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="email" className="form-label text-white-75">Email</label>
              <input
                type="email"
                id="email"
                className="form-control bg-transparent text-white border-light"
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="message" className="form-label text-white-75">Message</label>
              <textarea
                id="message"
                className="form-control bg-transparent text-white border-light"
                rows="4"
                placeholder="Hi, I'd like to..."
                value={formData.message}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-accent"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="col-lg-6">
        <div className="glass-card p-4 h-100 feature-list-card">
          <h5 className="mb-3">Need help?</h5>
          <p className="small-note mb-4">Reach out by email or connect on social media.</p>
          
          <p className="mb-2">
            <strong>Email:</strong>{' '}
            <a className="text-accent" href="mailto:support@ocusense.ai">
              support@ocusense.ai
            </a>
          </p>
          
          <p className="mb-4"><strong>Social:</strong></p>
          
          <a
            className="btn btn-outline-light me-2 mb-2"
            href="https://www.linkedin.com/in/francis-job/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fab fa-linkedin me-2"></i>LinkedIn
          </a>
          
          <a
            className="btn btn-outline-light me-2 mb-2"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fab fa-github me-2"></i>GitHub
          </a>
          
          <a
            className="btn btn-outline-light me-2 mb-2"
            href="https://www.instagram.com/francissjob/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fab fa-instagram me-2"></i>Instagram
          </a>
        </div>
      </div>
    </div>
  );
};

export default Contact;