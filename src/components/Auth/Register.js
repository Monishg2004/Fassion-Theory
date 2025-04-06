import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/auth';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer', // Default to buyer
    // Trader-specific fields (shown conditionally)
    business_name: '',
    business_description: '',
    location: '',
    sustainable_practices: '',
    cultural_heritage: ''
  });
  
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // For multi-step registration
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    
    // Validate first step
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // If role is buyer or first step is complete, move to next step
    if (formData.role === 'buyer' || step === 1) {
      setError(null);
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Format sustainable practices as array
      const userData = {
        ...formData,
        sustainable_practices: formData.sustainable_practices
          ? formData.sustainable_practices.split(',').map(practice => practice.trim())
          : []
      };
      
      // Remove confirmPassword field
      delete userData.confirmPassword;
      
      // Register user
      const result = await authService.register(userData);
      
      // Redirect based on role
      if (result.user.role === 'trader') {
        navigate('/trader/dashboard');
      } else {
        navigate('/outfit');
      }
    } catch (error) {
      setError(error.message);
      setStep(1); // Back to first step on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container register">
      <div className="auth-card">
        <div className="auth-header">
          <h2>{step === 1 ? 'Create an Account' : 'Complete Your Profile'}</h2>
          <p>{step === 1 
            ? 'Join Fashion Theory to access all features' 
            : formData.role === 'trader' 
              ? 'Tell us about your business'
              : 'Almost there!'
          }</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form className="auth-form" onSubmit={step === 1 ? handleNextStep : handleSubmit}>
          {step === 1 ? (
            // Step 1: Basic information
            <>
              <div className="form-group">
                <label htmlFor="username">Username*</label>
                <div className="input-with-icon">
                  <i className="fas fa-user"></i>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address*</label>
                <div className="input-with-icon">
                  <i className="fas fa-envelope"></i>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password*</label>
                <div className="input-with-icon">
                  <i className="fas fa-lock"></i>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password*</label>
                <div className="input-with-icon">
                  <i className="fas fa-lock"></i>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>I want to:</label>
                <div className="role-selection">
                  <label className={`role-option ${formData.role === 'buyer' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value="buyer"
                      checked={formData.role === 'buyer'}
                      onChange={handleChange}
                    />
                    <div className="role-icon">
                      <i className="fas fa-shopping-bag"></i>
                    </div>
                    <div className="role-details">
                      <span className="role-title">Buy Products</span>
                      <span className="role-description">Find unique items for your wardrobe</span>
                    </div>
                  </label>
                  
                  <label className={`role-option ${formData.role === 'trader' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value="trader"
                      checked={formData.role === 'trader'}
                      onChange={handleChange}
                    />
                    <div className="role-icon">
                      <i className="fas fa-store"></i>
                    </div>
                    <div className="role-details">
                      <span className="role-title">Sell Products</span>
                      <span className="role-description">Share your crafts with the world</span>
                    </div>
                  </label>
                </div>
              </div>
              
              <button type="submit" className="auth-button">
                Next <i className="fas fa-arrow-right"></i>
              </button>
            </>
          ) : (
            // Step 2: Role-specific information
            <>
              {formData.role === 'trader' ? (
                // Trader fields
                <>
                  <div className="form-group">
                    <label htmlFor="business_name">Business Name*</label>
                    <div className="input-with-icon">
                      <i className="fas fa-briefcase"></i>
                      <input
                        type="text"
                        id="business_name"
                        name="business_name"
                        value={formData.business_name}
                        onChange={handleChange}
                        placeholder="Your business or brand name"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="business_description">Business Description*</label>
                    <textarea
                      id="business_description"
                      name="business_description"
                      value={formData.business_description}
                      onChange={handleChange}
                      placeholder="Tell us about your business and what you sell"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="location">Location*</label>
                    <div className="input-with-icon">
                    <i className="fas fa-map-marker-alt"></i>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="City, Country"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="sustainable_practices">Sustainable Practices</label>
                    <textarea
                      id="sustainable_practices"
                      name="sustainable_practices"
                      value={formData.sustainable_practices}
                      onChange={handleChange}
                      placeholder="List your sustainable practices (comma separated)"
                    />
                    <div className="field-hint">E.g., Organic materials, Zero waste, Fair wages</div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="cultural_heritage">Cultural Heritage</label>
                    <textarea
                      id="cultural_heritage"
                      name="cultural_heritage"
                      value={formData.cultural_heritage}
                      onChange={handleChange}
                      placeholder="Share about your cultural background and how it influences your craft"
                    />
                  </div>
                </>
              ) : (
                // Buyer additional fields (or just confirmation)
                <div className="confirmation-message">
                  <i className="fas fa-check-circle"></i>
                  <p>Your basic information has been collected. Click "Complete Registration" to create your account.</p>
                </div>
              )}
              
              <div className="form-buttons">
                <button 
                  type="button" 
                  className="back-button"
                  onClick={handlePrevStep}
                >
                  <i className="fas fa-arrow-left"></i> Back
                </button>
                
                <button 
                  type="submit" 
                  className="auth-button"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Registering...
                    </>
                  ) : 'Complete Registration'}
                </button>
              </div>
            </>
          )}
        </form>
        
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="auth-bubble"></div>
      <div className="auth-bubble"></div>
      <div className="auth-bubble"></div>
    </div>
  );
};

export default Register;