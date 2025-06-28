import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/clientConfig';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
import { FaSpinner } from 'react-icons/fa';
import AccountLayout from '../../components/layouts/AccountLayout';

const ClientHome = () => {
  const { user, userRole } = useAuth();
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [routes, setRoutes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [seats, setSeats] = useState(1);
  const [matchedBuses, setMatchedBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [busesLoading, setBusesLoading] = useState(false);
  const [busesError, setBusesError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return setLoading(false);
      try {
        const clientSnap = await getDoc(doc(db, 'clients', user.uid));
        if (clientSnap.exists()) setClientData(clientSnap.data());
        else setError('No profile data found.');

        const routesSnap = await getDocs(collection(db, 'routes'));
        setRoutes(routesSnap.docs.map(d => ({ routeName: d.data().routeName, stops: d.data().stops || [] })));
      } catch (err) {
        console.error(err);
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Cleanup function to unsubscribe from listeners
    return () => {
      if (window.busesUnsubscribe) {
        window.busesUnsubscribe();
      }
    };
  }, [user]);

  const openModal = route => {
    setCurrentRoute(route);
    setDeparture('');
    setDestination('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentRoute(null);
    // Unsubscribe from previous listener when closing modal
    if (window.busesUnsubscribe) {
      window.busesUnsubscribe();
      window.busesUnsubscribe = null;
    }
    setMatchedBuses([]);
  };

  const handleConfirm = () => {
    if (!currentRoute?.routeName) return;
    
    setBusesLoading(true);
    setBusesError('');
    setMatchedBuses([]);
    
    const q = query(
      collection(db, 'availableBuses'),
      where('currentRoute', '==', currentRoute.routeName),
      where('availableSeats', '>', 0)
    );

    window.busesUnsubscribe = onSnapshot(q, 
      (snapshot) => {
        const busesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMatchedBuses(busesList);
        setBusesLoading(false);
      },
      (error) => {
        console.error('Error in buses listener:', error);
        setBusesError('Failed to load available buses. Please try again.');
        setBusesLoading(false);
      }
    );

    setIsModalOpen(false);
  };

  const resetFlow = () => {
    if (window.busesUnsubscribe) {
      window.busesUnsubscribe();
      window.busesUnsubscribe = null;
    }
    setCurrentRoute(null);
    setDeparture('');
    setDestination('');
    setMatchedBuses([]);
    setSelectedBus(null);
    setSuccessMessage('');
    setSeats(1);
    setBusesError('');
    setBusesLoading(false);
  };

  const handleBookNow = async (bus) => {
    if (seats > bus.availableSeats) {
      setError(`Cannot book more than ${bus.availableSeats} seats`);
      return;
    }
    
    setBookingLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      // First check if the bus still has enough seats
      const busRef = doc(db, 'availableBuses', bus.id);
      
      await runTransaction(db, async (transaction) => {
        const busSnap = await transaction.get(busRef);
        
        if (!busSnap.exists()) {
          throw new Error('This bus is no longer available');
        }

        const currentBusData = busSnap.data();
        if (currentBusData.availableSeats < seats) {
          throw new Error(`Sorry, only ${currentBusData.availableSeats} seats are now available`);
        }

        // Update available seats first
        const newAvailableSeats = currentBusData.availableSeats - seats;
        transaction.update(busRef, {
          availableSeats: newAvailableSeats
        });

        // Then create the booking with client UID
        const bookingRef = doc(collection(db, 'bookings'));
        transaction.set(bookingRef, {
          clientId: user.uid, // Ensure client UID is stored
          clientName: clientData.displayName,
          clientEmail: user.email, // Store client email for reference
          departure,
          destination,
          routeName: currentRoute.routeName,
          busId: bus.id,
          licensePlate: bus.licensePlate,
          driverId: bus.driverId, // Store driver ID for reference
          driverName: bus.driverName,
          seats,
          status: 'waiting for pickup',
          timestamp: new Date(),
          updatedAt: new Date() // Track when the booking was last updated
        });
      });
      
      setSuccessMessage(`Successfully booked ${seats} seat${seats > 1 ? 's' : ''}! Waiting for pickup.`);
      setSeats(1); // Reset seats after successful booking
    } catch (err) {
      console.error(err);
      if (err.message.includes('no longer available')) {
        setError(err.message);
      } else if (err.message.includes('only')) {
        setError(err.message);
      } else if (err.code === 'permission-denied') {
        setError('You do not have permission to make this booking');
      } else if (err.code === 'unavailable') {
        setError('Service temporarily unavailable. Please try again.');
      } else {
        setError('Failed to book. Please try again.');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const renderBusesList = () => {
    if (busesLoading) {
      return (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="flex items-center justify-center gap-2 text-pink-600">
            <FaSpinner className="animate-spin" />
            <span>Loading available buses...</span>
          </div>
        </div>
      );
    }

    if (busesError) {
      return (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-red-600 mb-2">{busesError}</p>
          <button
            onClick={handleConfirm}
            className="mt-4 px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (matchedBuses.length === 0) {
      return (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600 text-lg mb-2">No buses available at the moment</p>
          <p className="text-gray-500">Buses will appear here as soon as they become available</p>
          <div className="mt-4 flex justify-center">
            <div className="animate-pulse flex space-x-2">
              <div className="h-2 w-2 bg-pink-400 rounded-full"></div>
              <div className="h-2 w-2 bg-pink-400 rounded-full"></div>
              <div className="h-2 w-2 bg-pink-400 rounded-full"></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <ul className="grid grid-cols-1 gap-4">
        {matchedBuses.map((bus, idx) => (
          <li key={idx} className="bg-white p-4 rounded-lg shadow">
            <p><strong>Driver:</strong> {bus.driverName}</p>
            <p><strong>License Plate:</strong> {bus.licensePlate}</p>
            <p><strong>Type:</strong> {bus.type}</p>
            <p className="text-green-600 font-semibold">
              <strong>Available Seats:</strong> {bus.availableSeats}
            </p>
            <label className="block my-4">
              <span className="text-gray-700">Number of Seats</span>
              <div className="flex items-center mt-1">
                <button 
                  onClick={() => setSeats(prev => Math.max(1, prev - 1))}
                  disabled={seats <= 1}
                  className="px-3 py-1 border border-gray-300 rounded-l-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={bus.availableSeats}
                  step={1}
                  value={seats || ''}
                  onChange={e => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value);
                    if (val === '' || (!isNaN(val) && val > 0 && val <= bus.availableSeats)) {
                      setSeats(val === '' ? 1 : val);
                      setError(''); // Clear any previous errors
                    } else if (val > bus.availableSeats) {
                      setError(`Cannot book more than ${bus.availableSeats} seats`);
                    }
                  }}
                  onBlur={e => {
                    if (e.target.value === '' || isNaN(parseInt(e.target.value))) {
                      setSeats(1);
                    } else if (parseInt(e.target.value) > bus.availableSeats) {
                      setSeats(bus.availableSeats);
                    }
                  }}
                  className="input w-20 text-center border-t border-b border-gray-300 py-1"
                />
                <button 
                  onClick={() => setSeats(prev => Math.min(bus.availableSeats, prev + 1))}
                  disabled={seats >= bus.availableSeats}
                  className="px-3 py-1 border border-gray-300 rounded-r-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              {seats > bus.availableSeats && (
                <p className="text-red-500 text-sm mt-1">
                  Only {bus.availableSeats} seats available
                </p>
              )}
            </label>
            <button
              onClick={() => handleBookNow(bus)}
              disabled={bookingLoading || seats > bus.availableSeats}
              className="mt-2 px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50 w-full"
            >
              {bookingLoading ? 'Booking...' : 'Book Now'}
            </button>
          </li>
        ))}
      </ul>
    );
  };

  if (loading) {
    return (
      <AccountLayout>
        <div className="flex min-h-screen items-center justify-center bg-pink-50">
          <div className="text-pink-600">Loading your data...</div>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout>
      <div className="min-h-screen bg-pink-50 p-6 flex flex-col items-center">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md p-6 text-center">
          <h2 className="text-3xl font-bold text-pink-700 mb-2">
            {clientData?.displayName ? `Welcome, ${clientData.displayName}` : 'Welcome, Client'}!
          </h2>
          <p className="text-gray-600 mb-4">
            You are logged in as a <span className="font-medium capitalize">{userRole}</span>
          </p>
          <p className="text-gray-800 text-lg">
            Email: <span className="font-semibold">{user?.email}</span>
          </p>
          {clientData?.phone && (
            <p className="text-gray-800 text-lg mt-2">
              Phone: <span className="font-semibold">{clientData.phone}</span>
            </p>
          )}
        </div>

        {!currentRoute ? (
          <div className="mt-10 w-full max-w-3xl">
            <h3 className="text-2xl font-semibold text-pink-600 mb-4 text-center">Available Routes</h3>
            {routes.length ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routes.map((route, idx) => (
                  <li
                    key={idx}
                    onClick={() => openModal(route)}
                    className="cursor-pointer bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition"
                  >
                    <span className="text-lg font-medium text-pink-700">{route.routeName}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 text-center">No routes available at the moment.</p>
            )}
          </div>
        ) : (
          <div className="mt-10 w-full max-w-3xl">
            <button onClick={resetFlow} className="mb-4 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">
              Back to Route Selection
            </button>
            <h3 className="text-xl font-bold text-pink-700 mb-4 text-center">
              {currentRoute.routeName} - Available Buses
            </h3>
            {renderBusesList()}
          </div>
        )}

        {isModalOpen && currentRoute && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
              <h4 className="text-xl font-semibold text-pink-700 mb-4 text-center">
                {currentRoute.routeName}
              </h4>
              <label className="block mb-2">
                <span className="text-gray-700">Departure Stop</span>
                <select
                  value={departure}
                  onChange={e => { setDeparture(e.target.value); setDestination(''); }}
                  className="input block w-full mt-1"
                >
                  <option value="" disabled>Select departure</option>
                  {currentRoute.stops.map((stop, idx) => (
                    <option key={idx} value={stop.name ?? stop}>
                      {stop.name ?? stop}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block mb-4">
                <span className="text-gray-700">Destination Stop</span>
                <select
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  disabled={!departure}
                  className="input block w-full mt-1"
                >
                  <option value="" disabled>
                    {departure ? 'Select destination' : 'Select departure first'}
                  </option>
                  {currentRoute.stops
                    .filter(s => (s.name ?? s) !== departure)
                    .map((stop, idx) => (
                      <option key={idx} value={stop.name ?? stop}>
                        {stop.name ?? stop}
                      </option>
                    ))}
                </select>
              </label>
              <div className="flex justify-end space-x-4">
                <button onClick={closeModal} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!departure || !destination}
                  className="px-4 py-2 rounded-lg bg-pink-600 text-white disabled:opacity-50 hover:bg-pink-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
            {successMessage}
          </div>
        )}
      </div>
    </AccountLayout>
  );
};

export default ClientHome;
