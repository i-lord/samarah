import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBusAlt, FaPhoneAlt, FaInfoCircle, FaHandsHelping } from 'react-icons/fa';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-rose-100 via-pink-200 to-pink-300 text-gray-800">
      {/* Header */}
      <header className="text-center py-12">
        <h1 className="text-5xl md:text-6xl font-black text-pink-600 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-fuchsia-500 to-pink-600">
            Samarah
          </span>
        </h1>
        <p className="mt-4 text-xl text-gray-700 font-medium">
          Your trusted public transport booking platform
        </p>
      </header>

      {/* Role Selection */}
      <section className="w-full max-w-5xl mx-auto px-4 grid gap-6 grid-cols-1 md:grid-cols-3 mb-16">
        <button
          onClick={() => navigate('/client/auth')}
          className="py-5 px-8 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-xl transition text-lg"
        >
          <FaBusAlt className="inline-block mr-2" /> I am a Client
        </button>

        <button
          onClick={() => navigate('/driver/auth')}
          className="py-5 px-8 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-xl shadow-xl transition text-lg"
        >
          <FaBusAlt className="inline-block mr-2" /> I am a Driver
        </button>

        <button
          onClick={() => navigate('/owner/auth')}
          className="py-5 px-8 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xl transition text-lg"
        >
          <FaBusAlt className="inline-block mr-2" /> I am a Bus Owner
        </button>
      </section>

      {/* Info Sections */}
      <section className="bg-white text-gray-800 py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <FaInfoCircle className="text-4xl text-pink-600 mx-auto mb-2" />
            <h3 className="text-xl font-bold mb-1">About Us</h3>
            <p className="text-sm">Samarah helps you find available buses fast. No more long lines or guessing when the next ride is.</p>
          </div>
          <div>
            <FaHandsHelping className="text-4xl text-pink-600 mx-auto mb-2" />
            <h3 className="text-xl font-bold mb-1">Help & Support</h3>
            <p className="text-sm">Our team is here to assist clients, drivers, and owners anytime. We're just a message away.</p>
          </div>
          <div>
            <FaPhoneAlt className="text-4xl text-pink-600 mx-auto mb-2" />
            <h3 className="text-xl font-bold mb-1">Contact</h3>
            <p className="text-sm">Email us at support@samarah.com or call +257-123-456-789.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-600 bg-white">
        &copy; {new Date().getFullYear()} Samarah. All rights reserved.
      </footer>
    </div>
  );
}

export default LandingPage;
