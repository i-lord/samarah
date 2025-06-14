import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/clientConfig';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { FaBus, FaUser, FaClock, FaMapMarkerAlt, FaCheckCircle, FaSpinner, FaArrowRight } from 'react-icons/fa';

const ClientBooking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'bookings'),
      where('clientId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const bookingsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));

        // Sort bookings: active first, then completed
        const sortedBookings = bookingsList.sort((a, b) => {
          const statusOrder = {
            'waiting for pickup': 0,
            'en route': 1,
            'completed': 2
          };
          return statusOrder[a.status] - statusOrder[b.status];
        });

        setBookings(sortedBookings);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const EmptyState = () => (
    <div className="rounded-lg bg-white p-8 text-center shadow-md">
      <div className="mx-auto max-w-md">
        <div className="mb-4 text-6xl text-pink-200">
          <FaBus className="mx-auto" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-gray-800">No Bookings Yet</h3>
        <p className="mb-6 text-gray-600">
          Ready to start your journey? Book your first ride and experience convenient travel with us.
        </p>
        <button
          onClick={() => navigate('/client/home')}
          className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-6 py-3 text-white hover:bg-pink-700 transition-colors"
        >
          Start Booking
          <FaArrowRight />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pink-50">
        <div className="flex items-center gap-2 text-pink-600">
          <FaSpinner className="animate-spin" />
          Loading your bookings...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pink-50">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold text-pink-700">My Bookings</h1>

        {bookings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className={`rounded-lg border p-6 shadow-md ${
                  booking.status === 'waiting for pickup' || booking.status === 'en route'
                    ? 'bg-white'
                    : 'bg-gray-50'
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {booking.status === 'waiting for pickup' ? (
                      <FaClock className="text-yellow-500" />
                    ) : booking.status === 'en route' ? (
                      <FaBus className="text-blue-500" />
                    ) : (
                      <FaCheckCircle className="text-green-500" />
                    )}
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                      booking.status === 'waiting for pickup'
                        ? 'bg-yellow-50 text-yellow-700'
                        : booking.status === 'en route'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-green-50 text-green-700'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {booking.timestamp.toLocaleDateString()}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FaBus className="text-pink-600" />
                      <div>
                        <p className="text-sm text-gray-600">Bus</p>
                        <p className="font-medium">{booking.licensePlate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaUser className="text-pink-600" />
                      <div>
                        <p className="text-sm text-gray-600">Driver</p>
                        <p className="font-medium">{booking.driverName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-pink-600" />
                      <div>
                        <p className="text-sm text-gray-600">Route</p>
                        <p className="font-medium">{booking.routeName}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Journey</p>
                      <p className="font-medium">
                        {booking.departure} → {booking.destination}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <div>
                    <p className="text-sm text-gray-600">Seats Booked</p>
                    <p className="font-medium">{booking.seats}</p>
                  </div>
                  {booking.status === 'completed' && (
                    <div className="text-sm text-gray-500">
                      Completed on {booking.updatedAt.toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientBooking;