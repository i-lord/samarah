import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/clientConfig';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  deleteDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

export default function DriverHome() {
  const { user, userRole } = useAuth();
  const [driver, setDriver] = useState(null);
  const [buses, setBuses] = useState([]);
  const [currentBusInfo, setCurrentBusInfo] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedBus, setSelectedBus] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [loading, setLoading] = useState(true);
  const [activateLoading, setActivateLoading] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState({});
  const [passengersOnBoard, setPassengersOnBoard] = useState(0);
  const [availableSeats, setAvailableSeats] = useState(0);

  useEffect(() => {
    // Check if user is a driver
    if (userRole !== 'driver') {
      setError('Unauthorized access. Driver account required.');
      setLoading(false);
      return;
    }

    const fetchDriver = async () => {
      if (!user?.uid) return;
      const driverRef = doc(db, 'drivers', user.uid);
      const driverSnap = await getDoc(driverRef);
      if (driverSnap.exists()) {
        const driverData = driverSnap.data();
        setDriver(driverData);

        if (driverData.active) {
          // Fetch current bus info when driver is active
          const busRef = doc(db, 'buses', driverData.currentBus);
          const busSnap = await getDoc(busRef);
          if (busSnap.exists()) {
            const busData = busSnap.data();
            setCurrentBusInfo({ id: busSnap.id, ...busData });
            setPassengersOnBoard(busData.passengersOnBoard || 0);
            setAvailableSeats(busData.availableSeats || busData.capacity);
          }
          // Set up real-time bookings listener
          setupBookingsListener(driverData.currentBus);
        } else {
          const q = query(
            collection(db, 'buses'),
            where('company', '==', driverData.company),
            where('active', '==', false)
          );
          const busesSnap = await getDocs(q);
          const busList = busesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setBuses(busList);

          const routesSnap = await getDocs(collection(db, 'routes'));
          const routeList = routesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setRoutes(routeList);
        }
      }
      setLoading(false);
    };
    fetchDriver();

    // Cleanup function to unsubscribe from listeners
    return () => {
      if (driver?.active) {
        // The unsubscribe function will be set by setupBookingsListener
        if (window.bookingsUnsubscribe) {
          window.bookingsUnsubscribe();
        }
      }
    };
  }, [user, userRole]);

  const setupBookingsListener = (busId) => {
    if (!busId) return;
    setBookingsLoading(true);

    const q = query(
      collection(db, 'bookings'),
      where('busId', '==', busId),
      where('status', 'in', ['waiting for pickup', 'en route'])
    );

    // Store the unsubscribe function globally so we can access it in the cleanup
    window.bookingsUnsubscribe = onSnapshot(q, 
      (snapshot) => {
        const bookingsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBookings(bookingsList);
        setBookingsLoading(false);
      },
      (error) => {
        console.error('Error in bookings listener:', error);
        setError('Failed to load bookings');
        setBookingsLoading(false);
      }
    );
  };

  const handleActivate = async () => {
    if (!selectedBus || !selectedRoute || !user) return;
    setActivateLoading(true);
    setError('');

    try {
      await runTransaction(db, async (transaction) => {
        const busRef = doc(db, 'buses', selectedBus);
        const driverRef = doc(db, 'drivers', user.uid);
        const routeRef = doc(db, 'routes', selectedRoute);
        const busSnap = await transaction.get(busRef);
        const driverSnap = await transaction.get(driverRef);
        const routeSnap = await transaction.get(routeRef);

        if (!busSnap.exists() || !driverSnap.exists() || !routeSnap.exists()) {
          throw new Error('Bus, driver, or route not found');
        }

        const busData = busSnap.data();
        const driverData = driverSnap.data();

        transaction.update(busRef, {
          active: true,
          currentDriver: user.uid,
          currentRoute: selectedRoute,
          passengersOnBoard: 0,
          availableSeats: busData.capacity
        });

        transaction.update(driverRef, {
          active: true,
          currentBus: selectedBus,
          currentRoute: selectedRoute,
        });

        const availableBusRef = doc(db, 'availableBuses', selectedBus);
        transaction.set(availableBusRef, {
          driverName: driverData.displayName,
          driverUid: user.uid,
          licensePlate: busData.licensePlate,
          capacity: busData.capacity,
          type: busData.type,
          ownerId: busData.ownerId,
          currentRoute: selectedRoute,
          passengersOnBoard: 0,
          availableSeats: busData.capacity
        });
      });

      const updatedDriver = await getDoc(doc(db, 'drivers', user.uid));
      const driverData = updatedDriver.data();
      setDriver(driverData);

      // Fetch current bus info after activation
      const busRef = doc(db, 'buses', selectedBus);
      const busSnap = await getDoc(busRef);
      if (busSnap.exists()) {
        const busData = busSnap.data();
        setCurrentBusInfo({ id: busSnap.id, ...busData });
        setPassengersOnBoard(busData.passengersOnBoard || 0);
        setAvailableSeats(busData.availableSeats || busData.capacity);
      }

      // Set up real-time bookings listener after activation
      setupBookingsListener(selectedBus);
    } catch (err) {
      console.error(err);
      setError('Activation failed. Please try again.');
    } finally {
      setActivateLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!driver?.currentBus) return;
    setDeactivateLoading(true);
    setError('');

    try {
      // Unsubscribe from bookings listener before deactivating
      if (window.bookingsUnsubscribe) {
        window.bookingsUnsubscribe();
        window.bookingsUnsubscribe = null;
      }

      const busRef = doc(db, 'buses', driver.currentBus);
      const driverRef = doc(db, 'drivers', user.uid);
      const availableBusRef = doc(db, 'availableBuses', driver.currentBus);

      await runTransaction(db, async (transaction) => {
        transaction.update(busRef, {
          active: false,
          currentDriver: null,
          currentRoute: null,
        });

        transaction.update(driverRef, {
          active: false,
          currentBus: null,
          currentRoute: null,
        });

        transaction.delete(availableBusRef);
      });

      const updatedDriver = await getDoc(driverRef);
      setDriver(updatedDriver.data());
      setCurrentBusInfo(null);
      setPassengersOnBoard(0);
      setAvailableSeats(0);
      setSelectedBus('');
      setSelectedRoute('');
      setBookings([]); // Clear bookings when deactivating
    } catch (err) {
      console.error(err);
      setError('Deactivation failed. Please try again.');
    } finally {
      setDeactivateLoading(false);
    }
  };

  const handlePickup = async (bookingId) => {
    setLoadingBookings(prev => ({ ...prev, [bookingId]: true }));
    setError('');
    try {
      await runTransaction(db, async (transaction) => {
        // First, perform all reads
        const bookingRef = doc(db, 'bookings', bookingId);
        const availableBusRef = doc(db, 'availableBuses', driver.currentBus);
        
        const [bookingSnap, availableBusSnap] = await Promise.all([
          transaction.get(bookingRef),
          transaction.get(availableBusRef)
        ]);

        if (!bookingSnap.exists() || !availableBusSnap.exists()) {
          throw new Error('Booking or bus not found');
        }

        const bookingData = bookingSnap.data();
        const currentData = availableBusSnap.data();
        const newPassengersOnBoard = (currentData.passengersOnBoard || 0) + bookingData.seats;

        // Then, perform all writes
        transaction.update(bookingRef, {
          status: 'en route',
          pickupTime: new Date()
        });

        // Only update passengersOnBoard, not availableSeats
        transaction.update(availableBusRef, {
          passengersOnBoard: newPassengersOnBoard
        });

        // Update local state after successful transaction
        setPassengersOnBoard(newPassengersOnBoard);
      });
    } catch (err) {
      console.error('Error updating booking:', err);
      setError('Failed to update booking status');
    } finally {
      setLoadingBookings(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleDropoff = async (bookingId) => {
    setLoadingBookings(prev => ({ ...prev, [bookingId]: true }));
    setError('');
    try {
      await runTransaction(db, async (transaction) => {
        // First, perform all reads
        const bookingRef = doc(db, 'bookings', bookingId);
        const availableBusRef = doc(db, 'availableBuses', driver.currentBus);
        
        const [bookingSnap, availableBusSnap] = await Promise.all([
          transaction.get(bookingRef),
          transaction.get(availableBusRef)
        ]);

        if (!bookingSnap.exists() || !availableBusSnap.exists()) {
          throw new Error('Booking or bus not found');
        }

        const bookingData = bookingSnap.data();
        const currentData = availableBusSnap.data();
        const newPassengersOnBoard = (currentData.passengersOnBoard || 0) - bookingData.seats;

        // Then, perform all writes
        transaction.update(bookingRef, {
          status: 'completed',
          dropoffTime: new Date()
        });

        // Only update passengersOnBoard, not availableSeats
        transaction.update(availableBusRef, {
          passengersOnBoard: newPassengersOnBoard
        });

        // Update local state after successful transaction
        setPassengersOnBoard(newPassengersOnBoard);
      });
    } catch (err) {
      console.error('Error updating booking:', err);
      setError('Failed to update booking status');
    } finally {
      setLoadingBookings(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  if (loading) return <p className="text-center text-pink-600">Loading...</p>;
  if (!user || userRole !== 'driver') return <p className="text-center text-red-600">Unauthorized access. Driver account required.</p>;
  if (!driver) return <p className="text-center text-red-600">Driver not found.</p>;

  return (
    <div className="p-6 bg-pink-50 shadow-xl rounded-2xl max-w-4xl mx-auto border border-pink-200">
      <h2 className="text-2xl font-semibold text-pink-700 mb-4">Welcome, {driver.firstName}</h2>

      {error && <p className="text-red-600 mb-2">{error}</p>}

      {driver.active ? (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-pink-800">
              <strong>Bus:</strong> {currentBusInfo?.licensePlate || 'Loading...'}
            </p>
            <p className="text-pink-800">
              <strong>Route:</strong> {driver.currentRoute}
            </p>
            <button
              onClick={handleDeactivate}
              disabled={deactivateLoading}
              className="mt-4 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition duration-200 w-full"
            >
              {deactivateLoading ? 'Deactivating...' : 'Deactivate'}
            </button>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-pink-700 mb-4">Current Bookings</h3>
            {bookingsLoading ? (
              <p className="text-gray-600">Loading bookings...</p>
            ) : bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map(booking => (
                  <div key={booking.id} className="border border-pink-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p><strong>Client:</strong> {booking.clientName}</p>
                        <p><strong>From:</strong> {booking.departure}</p>
                        <p><strong>To:</strong> {booking.destination}</p>
                        <p><strong>Seats:</strong> {booking.seats}</p>
                        <p><strong>Status:</strong> <span className="capitalize">{booking.status}</span></p>
                        <p className="text-sm text-gray-500">
                          Booked at: {booking.timestamp?.toDate().toLocaleString()}
                        </p>
                        {booking.pickupTime && (
                          <p className="text-sm text-gray-500">
                            Picked up at: {booking.pickupTime.toDate().toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-end">
                        {booking.status === 'waiting for pickup' && (
                          <button
                            onClick={() => handlePickup(booking.id)}
                            disabled={loadingBookings[booking.id]}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50"
                          >
                            {loadingBookings[booking.id] ? 'Picking up...' : 'Pick Up Client'}
                          </button>
                        )}
                        {booking.status === 'en route' && (
                          <button
                            onClick={() => handleDropoff(booking.id)}
                            disabled={loadingBookings[booking.id]}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50"
                          >
                            {loadingBookings[booking.id] ? 'Dropping off...' : 'Drop Off Client'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No active bookings</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-700">Select your bus and route to activate:</p>

          <select
            value={selectedBus}
            onChange={e => setSelectedBus(e.target.value)}
            className="input w-full border border-pink-300 rounded-lg py-2 px-3"
          >
            <option value="">Select Bus</option>
            {buses.map(bus => (
              <option key={bus.id} value={bus.id}>{bus.licensePlate}</option>
            ))}
          </select>

          <select
            value={selectedRoute}
            onChange={e => setSelectedRoute(e.target.value)}
            className="input w-full border border-pink-300 rounded-lg py-2 px-3"
            disabled={!selectedBus}
          >
            <option value="">Select Route</option>
            {routes.map(route => (
              <option key={route.id} value={route.id}>{route.routeName}</option>
            ))}
          </select>

          <button
            onClick={handleActivate}
            disabled={activateLoading}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition duration-200 w-full"
          >
            {activateLoading ? 'Activating...' : 'Activate'}
          </button>
        </div>
      )}
    </div>
  );
}
