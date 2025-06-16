import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/clientConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FaUser, FaPhone, FaEnvelope, FaIdCard, FaEdit, FaSave, FaTimes, FaSpinner, FaCamera, FaSignOutAlt } from 'react-icons/fa';

const DriverProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: user?.email || '',
    licenseNumber: '',
    licenseExpiry: '',
    address: '',
    photoURL: '',
    active: false
  });
  const [formData, setFormData] = useState({ ...profile });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;
      try {
        const docRef = doc(db, 'drivers', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          setFormData(data);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const docRef = doc(db, 'drivers', user.uid);
      await updateDoc(docRef, {
        ...formData,
        updatedAt: new Date()
      });

      setProfile(formData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // TODO: Implement photo upload to Firebase Storage
    // For now, we'll just show a message
    setSuccess('Photo upload functionality coming soon!');
  };

  const handleLogout = async () => {
    if (profile.active) {
      setError('Cannot logout while active. Please deactivate your status first.');
      return;
    }

    try {
      await logout();
      navigate('/');
    } catch (error) {
      setError('Failed to logout. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pink-50">
        <div className="flex items-center gap-2 text-pink-600">
          <FaSpinner className="animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-pink-600 bg-white">
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                  <FaUser className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>
            <label
              htmlFor="photo-upload"
              className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-pink-600 text-white shadow-lg hover:bg-pink-700"
            >
              <FaCamera className="h-5 w-5" />
              <input
                type="file"
                id="photo-upload"
                className="hidden"
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </label>
          </div>
          <h1 className="text-2xl font-bold text-pink-700">
            {profile.firstName} {profile.lastName}
          </h1>
          <p className="text-gray-600">
            {profile.active ? 'Active Driver' : 'Inactive Driver'}
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-white hover:bg-pink-700"
              >
                <FaEdit /> Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setFormData(profile);
                    setIsEditing(false);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
                >
                  <FaTimes /> Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-white hover:bg-pink-700 disabled:opacity-50"
                >
                  <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
          <button
            onClick={handleLogout}
            disabled={profile.active}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-colors ${
              profile.active
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            }`}
            title={profile.active ? 'Cannot logout while active' : 'Logout'}
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-600">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Personal Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-pink-500 focus:outline-none"
                    required
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{profile.firstName || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-pink-500 focus:outline-none"
                    required
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{profile.lastName || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-pink-500 focus:outline-none"
                    pattern="[0-9]{10}"
                    placeholder="10-digit phone number"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{profile.phone || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-gray-900">{profile.email}</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                {isEditing ? (
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-pink-500 focus:outline-none"
                    rows="2"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{profile.address || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Driver Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">License Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-pink-500 focus:outline-none"
                    required
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{profile.licenseNumber || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">License Expiry</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.licenseExpiry}
                    onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-pink-500 focus:outline-none"
                    required
                  />
                ) : (
                  <p className="mt-1 text-gray-900">
                    {profile.licenseExpiry ? new Date(profile.licenseExpiry).toLocaleDateString() : 'Not set'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriverProfile;