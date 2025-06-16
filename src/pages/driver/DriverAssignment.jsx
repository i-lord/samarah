import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/clientConfig';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { FaBus, FaUsers, FaRoute, FaMoneyBillWave, FaSpinner, FaCalendarAlt } from 'react-icons/fa';

const DriverAssignment = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState({
    totalPassengers: 0,
    totalTrips: 0,
    totalEarnings: 0,
    uniqueRoutes: new Set(),
    uniqueBuses: new Set()
  });

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.uid) return;

      try {
        // Query completed bookings where this driver was assigned
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('driverId', '==', user.uid),
          where('status', '==', 'completed'),
          orderBy('dropoffTime', 'desc')
        );

        const bookingsSnap = await getDocs(bookingsQuery);
        const bookingsList = bookingsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dropoffTime: doc.data().dropoffTime?.toDate(),
          pickupTime: doc.data().pickupTime?.toDate(),
          timestamp: doc.data().timestamp?.toDate()
        }));

        // Group bookings by trip (same bus and route on the same day)
        const tripsMap = new Map();
        bookingsList.forEach(booking => {
          const tripKey = `${booking.busId}-${booking.routeName}-${booking.dropoffTime.toDateString()}`;
          if (!tripsMap.has(tripKey)) {
            tripsMap.set(tripKey, {
              busId: booking.busId,
              licensePlate: booking.licensePlate,
              routeName: booking.routeName,
              date: booking.dropoffTime,
              passengers: 0,
              earnings: 0,
              bookings: []
            });
          }
          const trip = tripsMap.get(tripKey);
          trip.passengers += booking.seats;
          trip.earnings += booking.seats * 50; // Assuming $50 per seat
          trip.bookings.push(booking);
        });

        const tripsList = Array.from(tripsMap.values());
        
        // Calculate statistics
        const newStats = {
          totalPassengers: bookingsList.reduce((sum, booking) => sum + booking.seats, 0),
          totalTrips: tripsList.length,
          totalEarnings: tripsList.reduce((sum, trip) => sum + trip.earnings, 0),
          uniqueRoutes: new Set(tripsList.map(trip => trip.routeName)),
          uniqueBuses: new Set(tripsList.map(trip => trip.licensePlate))
        };

        setAssignments(tripsList);
        setStats(newStats);
      } catch (err) {
        console.error('Error fetching assignments:', err);
        setError('Failed to load assignment history');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pink-50">
        <div className="flex items-center gap-2 text-pink-600">
          <FaSpinner className="animate-spin" />
          Loading assignment history...
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
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-bold text-pink-700">Assignment History</h1>

        {/* Statistics Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-pink-100 p-3">
                <FaUsers className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Passengers</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPassengers}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-pink-100 p-3">
                <FaBus className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Trips</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalTrips}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-pink-100 p-3">
                <FaMoneyBillWave className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${stats.totalEarnings.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-pink-100 p-3">
                <FaRoute className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Unique Routes</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.uniqueRoutes.size}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assignment History Table */}
        <div className="rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Trip History</h2>
          {assignments.length === 0 ? (
            <p className="text-center text-gray-600">No completed trips found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-sm font-medium text-gray-600">
                    <th className="pb-3 pl-4">Date</th>
                    <th className="pb-3">Bus</th>
                    <th className="pb-3">Route</th>
                    <th className="pb-3">Passengers</th>
                    <th className="pb-3">Earnings</th>
                    <th className="pb-3 pr-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assignments.map((trip, index) => (
                    <tr key={index} className="text-sm">
                      <td className="py-4 pl-4">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-gray-400" />
                          {trip.date.toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <FaBus className="text-gray-400" />
                          {trip.licensePlate}
                        </div>
                      </td>
                      <td className="py-4">{trip.routeName}</td>
                      <td className="py-4">{trip.passengers}</td>
                      <td className="py-4">${trip.earnings.toLocaleString()}</td>
                      <td className="py-4 pr-4">
                        <button
                          onClick={() => {
                            // TODO: Implement trip details modal
                            console.log('Show trip details:', trip);
                          }}
                          className="rounded-lg bg-pink-100 px-3 py-1 text-sm text-pink-600 hover:bg-pink-200"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverAssignment;