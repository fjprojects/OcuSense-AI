import React, { useState } from "react";
import { useToast } from "./Toast";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();

  const handleChange = (event) => {
    const { id, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [id]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.message.trim()
    ) {
      showToast("Please fill all fields", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email.trim())) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Contact Message:", formData);

      showToast("Message received successfully", "success");

      setFormData({
        name: "",
        email: "",
        message: "",
      });
    } catch (error) {
      console.error("Contact form error:", error);

      showToast(
        "Something went wrong. Please try again.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="row gy-4">
      <div className="col-lg-6">
        <div className="glass-card p-5 mb-4">
          <p className="text-uppercase text-accent mb-3 small-note">
            Contact us
          </p>

          <h1 className="section-heading mb-3">
            Let's connect
          </h1>

          <p className="small-note mb-0">
            Send feedback, request a demo, or ask about improvements
            for the OcuSense AI project.
          </p>
        </div>

        <div className="glass-card contact-form-card p-4">
          <h5 className="mb-4">Contact form</h5>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label
                htmlFor="name"
                className="form-label contact-label"
              >
                Name
              </label>

              <input
                type="text"
                id="name"
                className="form-control contact-input"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-3">
              <label
                htmlFor="email"
                className="form-label contact-label"
              >
                Email
              </label>

              <input
                type="email"
                id="email"
                className="form-control contact-input"
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="message"
                className="form-label contact-label"
              >
                Message
              </label>

              <textarea
                id="message"
                className="form-control contact-input contact-textarea"
                rows="5"
                placeholder="Write your message here"
                value={formData.message}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              className="btn contact-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane me-2"></i>
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="col-lg-6">
        <div className="glass-card contact-help-card p-4">
          <h5 className="mb-3">Need help?</h5>

          <p className="small-note mb-4">
            Reach out by email or connect through social media.
          </p>

          <div className="contact-detail mb-4">
            <p className="mb-1 contact-detail-title">
              Email
            </p>

            <a
              className="text-accent text-decoration-none"
              href="mailto:support@ocusense.ai"
            >
              <i className="fas fa-envelope me-2"></i>
              support@ocusense.ai
            </a>
          </div>

          <p className="mb-3 contact-detail-title">
            Social media
          </p>
<div className="d-flex flex-wrap gap-2">
  <a
    className="btn contact-social-btn"
    href="https://www.linkedin.com/in/francis-job/"
    target="_blank"
    rel="noopener noreferrer"
  >
    <i className="fab fa-linkedin me-2"></i>
    LinkedIn
  </a>

  <a
    className="btn contact-social-btn"
    href="https://github.com/fjprojects"
    target="_blank"
    rel="noopener noreferrer"
  >
    <i className="fab fa-github me-2"></i>
    GitHub
  </a>

  <a
    className="btn contact-social-btn"
    href="https://www.instagram.com/francissjob/"
    target="_blank"
    rel="noopener noreferrer"
  >
    <i className="fab fa-instagram me-2"></i>
    Instagram
  </a>
</div>
        </div>
      </div>
    </div>
  );
};

export default Contact;