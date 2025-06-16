import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/clientConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FaUser, FaPhone, FaEnvelope, FaEdit, FaSave, FaTimes, FaCamera, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ClientProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    displayName: '',
    phone: '',
    email: user?.email || '',
    address: '',
    photoURL: user?.photoURL || '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });
  const [formData, setFormData] = useState({ ...profile });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;
      try {
        const docRef = doc(db, 'clients', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const profileData = {
            displayName: data.displayName || '',
            phone: data.phone || '',
            email: user.email || '',
            address: data.address || '',
            photoURL: data.photoURL || '',
            emergencyContact: data.emergencyContact || {
              name: '',
              phone: '',
              relationship: ''
            }
          };
          setProfile(profileData);
          setFormData(profileData);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('emergency.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const docRef = doc(db, 'clients', user.uid);
      await updateDoc(docRef, {
        displayName: formData.displayName,
        phone: formData.phone,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
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

  const cancelEdit = () => {
    setFormData(profile);
    setIsEditing(false);
    setError('');
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // TODO: Implement photo upload to Firebase Storage
    // For now, we'll just show a message
    setSuccess('Photo upload functionality coming soon!');
  };

  const handleLogout = async () => {
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
        <div className="text-pink-600">Loading profile...</div>
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
          <h1 className="text-2xl font-bold text-pink-700">{profile.displayName || 'Add Your Name'}</h1>
        </div>

        {!isEditing ? (
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-white hover:bg-pink-700"
            >
              <FaEdit /> Edit Profile
            </button>
          </div>
        ) : (
          <div className="mb-6 flex justify-end gap-2">
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
          </div>
        )}

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
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FaUser className="text-pink-600" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-pink-500 focus:outline-none"
                      required
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{profile.displayName || 'Not set'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FaPhone className="text-pink-600" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
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
              </div>

              <div className="flex items-center gap-3">
                <FaEnvelope className="text-pink-600" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-gray-900">{profile.email}</p>
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                {isEditing ? (
                  <textarea
                    name="address"
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
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Emergency Contact</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="emergency.name"
                    value={formData.emergencyContact.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                    })}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-pink-500 focus:outline-none"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{profile.emergencyContact.name || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="emergency.phone"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                    })}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-pink-500 focus:outline-none"
                    pattern="[0-9]{10}"
                    placeholder="10-digit phone number"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{profile.emergencyContact.phone || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Relationship</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="emergency.relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
                    })}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-pink-500 focus:outline-none"
                    placeholder="e.g., Spouse, Parent, Sibling"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{profile.emergencyContact.relationship || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>
        </form>

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-white hover:bg-red-700 transition-colors"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
