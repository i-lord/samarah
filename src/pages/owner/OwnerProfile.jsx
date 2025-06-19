import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/clientConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FaCamera, FaSpinner, FaSignOutAlt, FaEdit, FaSave } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const OwnerProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    photoURL: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;

      try {
        const ownerDoc = await getDoc(doc(db, 'owners', user.uid));
        if (ownerDoc.exists()) {
          setProfile(prev => ({
            ...prev,
            ...ownerDoc.data()
          }));
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      toast.success('Logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Failed to log out');
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // TODO: Implement photo upload to Firebase Storage
    toast.info('Photo upload functionality coming soon!');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'owners', user.uid), {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        company: profile.company,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zipCode: profile.zipCode,
        updatedAt: new Date()
      });

      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
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
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-pink-700">Owner Profile</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-white hover:bg-pink-700"
          >
            <FaSignOutAlt />
            Sign Out
          </button>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          {/* Profile Photo Section */}
          <div className="mb-8 flex flex-col items-center">
            <div className="relative mb-4">
              <div className="h-32 w-32 overflow-hidden rounded-full bg-pink-100">
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl text-pink-600">
                    {profile.firstName?.[0] || 'O'}
                  </div>
                )}
              </div>
              <label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-pink-600 text-white hover:bg-pink-700"
              >
                <FaCamera />
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>
            <p className="text-sm text-gray-600">Click the camera icon to update your photo</p>
          </div>

          {/* Profile Information */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                name="firstName"
                value={profile.firstName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full rounded-lg border border-gray-300 p-2 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={profile.lastName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full rounded-lg border border-gray-300 p-2 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={profile.email || user?.email || ''}
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-100 p-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full rounded-lg border border-gray-300 p-2 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Company Name</label>
              <input
                type="text"
                name="company"
                value={profile.company}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full rounded-lg border border-gray-300 p-2 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                name="address"
                value={profile.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full rounded-lg border border-gray-300 p-2 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                name="city"
                value={profile.city}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full rounded-lg border border-gray-300 p-2 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">State</label>
              <input
                type="text"
                name="state"
                value={profile.state}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full rounded-lg border border-gray-300 p-2 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">ZIP Code</label>
              <input
                type="text"
                name="zipCode"
                value={profile.zipCode}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full rounded-lg border border-gray-300 p-2 disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end gap-4">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-white hover:bg-pink-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-white hover:bg-pink-700"
              >
                <FaEdit />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerProfile;