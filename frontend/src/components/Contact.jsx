import React, { useRef, useState } from 'react';
import PageHeader from './PageHeader';
import { useToast } from './Toast';
import { api } from '../services/api';

const emptyForm = { name: '', email: '', message: '' };

const Contact = () => {
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const form = useRef(null);
  const { showToast } = useToast();

  const handleChange = event => {
    const { id, value } = event.target;
    setFormData(previous => ({ ...previous, [id]: value }));
    setErrors(previous => ({ ...previous, [id]: undefined }));
    setSubmitError('');
    setConfirmation('');
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (isSubmitting) return;
    const data = Object.fromEntries(Object.entries(formData).map(([key, value]) => [key, value.trim()]));
    const invalid = {};
    if (!data.name) invalid.name = 'Enter your name.';
    else if (data.name.length > 100) invalid.name = 'Use at most 100 characters.';
    if (!data.email) invalid.email = 'Enter your email address.';
    else if (data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      invalid.email = 'Enter a valid email address.';
    }
    if (!data.message) invalid.message = 'Write your feedback or question.';
    else if (data.message.length > 5000) invalid.message = 'Use at most 5,000 characters.';
    setErrors(invalid);
    setSubmitError('');
    setConfirmation('');
    const firstInvalid = Object.keys(invalid)[0];
    if (firstInvalid) {
      form.current.querySelector('#' + firstInvalid).focus();
      return;
    }
    setIsSubmitting(true);
    try {
      await api.sendContact(data);
      setFormData(emptyForm);
      setConfirmation('Thank you. Your feedback has been received.');
      showToast('Feedback received', 'success');
    } catch (error) {
      setSubmitError(error.message || 'We could not send your feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Contact and feedback" title="Help improve OcuSense"
        description="Report an issue, share an idea, or tell us what is working for you." />
      <div className="split-layout">
        <section className="glass-card contact-card">
          <div className="card-heading"><h2>Send feedback</h2><span className="status-pill neutral"><i className="fas fa-lock" aria-hidden="true" />Private</span></div>
          {confirmation && <div className="alert alert-success" role="status">{confirmation}</div>}
          {submitError && <div className="alert alert-danger" role="alert">{submitError} Your draft is still here; please try again.</div>}
          <form ref={form} onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
            <div className="form-pair mb-3">
              <div>
                <label htmlFor="name" className="form-label">Name</label>
                <input type="text" id="name" className="form-control" autoComplete="name" required maxLength={100}
                  placeholder="Your name" value={formData.name} onChange={handleChange} disabled={isSubmitting}
                  aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} />
                {errors.name && <p id="name-error" className="field-error mt-2 mb-0">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="email" className="form-label">Email</label>
                <input type="email" id="email" className="form-control" autoComplete="email" required maxLength={254}
                  placeholder="you@example.com" value={formData.email} onChange={handleChange} disabled={isSubmitting}
                  aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />
                {errors.email && <p id="email-error" className="field-error mt-2 mb-0">{errors.email}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="message" className="form-label">Message</label>
              <textarea id="message" className="form-control" rows="5" required maxLength={5000}
                placeholder="What happened, or what could we improve?" value={formData.message} onChange={handleChange} disabled={isSubmitting}
                aria-invalid={Boolean(errors.message)} aria-describedby={'message-hint' + (errors.message ? ' message-error' : '')} />
              <p id="message-hint" className="small-note mt-2 mb-0">Up to 5,000 characters. Please avoid sharing sensitive health information.</p>
              {errors.message && <p id="message-error" className="field-error mt-2 mb-0">{errors.message}</p>}
            </div>
            <div className="contact-submit">
              <p className="small-note">All fields are required.</p>
              <button type="submit" className="btn btn-accent" disabled={isSubmitting}>
                {isSubmitting ? <><span className="spinner-border spinner-border-sm" aria-hidden="true" />Sending…</> : <>Send feedback <i className="fas fa-arrow-right" aria-hidden="true" /></>}
              </button>
            </div>
          </form>
        </section>
        <aside className="glass-card contact-guide">
          <p className="eyebrow">Make your message useful</p>
          <h2>A few details go a long way</h2>
          <ol>
            <li>The page or feature you were using.</li>
            <li>What happened and what you expected.</li>
            <li>Your device and browser, for screen or camera issues.</li>
          </ol>
          <p className="small-note mb-4">Your feedback is shared with the project team. This form does not send an automatic email response.</p>
          <a className="btn btn-outline-light" href="https://github.com/fjprojects/OcuSense-AI" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-github" aria-hidden="true" />Project repository
          </a>
          <div className="social-links">
            <a href="https://www.linkedin.com/in/francis-job/" target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin me-1" aria-hidden="true" />LinkedIn</a>
            <a href="https://www.instagram.com/francissjob/" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram me-1" aria-hidden="true" />Instagram</a>
          </div>
        </aside>
      </div>
    </>
  );
};

export default Contact;
