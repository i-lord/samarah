import React, { useEffect, useState } from 'react';
import { signIn, signUp } from '../../firebase/auth';
import { createUserProfile } from '../../firebase/db';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/clientConfig';
import { useNavigate } from 'react-router-dom';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { toast } from 'react-hot-toast';

const DriverAuth = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
  });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanies = async () => {
      const snap = await getDocs(collection(db, 'companies'));
      const list = snap.docs.map(doc => doc.data().companyName);
      setCompanies(list);
    };
    fetchCompanies();
  }, []);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    if (isRegistering && formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      let userCred;
      if (isRegistering) {
        userCred = await signUp(formData.email, formData.password);
        await createUserProfile(userCred.user.uid, 'driver', {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          active: false,
        });
        toast.success('Registration successful! Redirecting...');
      } else {
        userCred = await signIn(formData.email, formData.password);
        toast.success('Sign in successful! Redirecting...');
      }
      setTimeout(() => navigate('/driver/home'), 1500);
    } catch (err) {
      const message = err.message.includes('email')
        ? 'Invalid email or already in use.'
        : err.message.includes('password')
        ? 'Incorrect password or weak password.'
        : 'Authentication failed. Please check your details.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-pink-700 mb-4 text-center">
          {isRegistering ? 'Driver Registration' : 'Driver Sign In'}
        </h2>

        {isRegistering && (
          <>
            <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" className="input" required />
            <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" className="input" required />
            <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" className="input" required />
            <select name="company" value={formData.company} onChange={handleChange} className="input" required autoComplete="off">
              <option value="">Select Company</option>
              {companies.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
              <option value="Other">Other</option>
            </select>
          </>
        )}

        <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" className="input" required />

        <div className="relative">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className="input pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-3 text-gray-500"
          >
            {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
          </button>
        </div>

        {isRegistering && (
          <div className="relative">
            <input
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              className="input pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(v => !v)}
              className="absolute right-3 top-3 text-gray-500"
            >
              {showConfirmPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
            </button>
          </div>
        )}

        <button
          type="submit"
          className="mt-4 w-full bg-pink-600 text-white py-2 rounded-xl hover:bg-pink-700 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? (isRegistering ? 'Registering...' : 'Signing in...') : (isRegistering ? 'Register' : 'Sign In')}
        </button>

        <p className="text-center text-sm text-gray-600 mt-4">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => setIsRegistering(v => !v)}
            className="text-pink-600 hover:underline"
          >
            {isRegistering ? 'Sign In' : 'Register'}
          </button>
        </p>
      </form>
    </div>
  );
}

export default DriverAuth