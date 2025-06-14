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
  onSnapshot,
  orderBy,
  limit,
} from 'firebase/firestore';

const OwnerHome = () => {
  const { user } = useAuth();
  const [ownerData, setOwnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buses, setBuses] = useState([]);
  const [activeBuses, setActiveBuses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [balance, setBalance] = useState({
    totalEarnings: 0,
    pendingPayments: 0,
    lastUpdated: null
  });

  useEffect(() => {
    const fetchOwnerData = async () => {
      if (!user?.uid) return;
      try {
        const ownerSnap = await getDoc(doc(db, 'owners', user.uid));
        if (ownerSnap.exists()) {
          setOwnerData(ownerSnap.data());
          // Set initial balance from owner data
          setBalance(prev => ({
            ...prev,
            totalEarnings: ownerSnap.data().totalEarnings || 0,
            pendingPayments: ownerSnap.data().pendingPayments || 0,
            lastUpdated: ownerSnap.data().lastPaymentUpdate || null
          }));
        }
      } catch (err) {
        console.error('Error fetching owner data:', err);
        setError('Failed to load profile data');
      }
    };

    const setupBusesListener = () => {
      const busesQuery = query(collection(db, 'buses'), where('ownerId', '==', user.uid));
      return onSnapshot(busesQuery, 
        (snapshot) => setBuses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
        (err) => console.error('Error in buses listener:', err)
      );
    };

    const setupActiveBusesListener = () => {
      const activeQuery = query(collection(db, 'availableBuses'), where('ownerId', '==', user.uid));
      return onSnapshot(activeQuery,
        (snapshot) => setActiveBuses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
        (err) => console.error('Error in active buses listener:', err)
      );
    };

    const setupActivitiesListener = () => {
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('ownerId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      return onSnapshot(activitiesQuery,
        (snapshot) => setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
        (err) => console.error('Error in activities listener:', err)
      );
    };

    const setupNotificationsListener = () => {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('ownerId', '==', user.uid),
        where('read', '==', false),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      return onSnapshot(notificationsQuery,
        (snapshot) => setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
        (err) => console.error('Error in notifications listener:', err)
      );
    };

    const loadData = async () => {
      setLoading(true);
      await fetchOwnerData();
      const busesUnsub = setupBusesListener();
      const activeUnsub = setupActiveBusesListener();
      const activitiesUnsub = setupActivitiesListener();
      const notificationsUnsub = setupNotificationsListener();
      setLoading(false);
      return () => {
        busesUnsub();
        activeUnsub();
        activitiesUnsub();
        notificationsUnsub();
      };
    };

    const cleanup = loadData();
    return () => cleanup;
  }, [user]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-pink-50"><div className="text-pink-600">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow p-6 mb-8">
          <h1 className="text-3xl font-bold text-pink-700 mb-2">Welcome, {ownerData?.displayName || 'Owner'}!</h1>
          <p className="text-gray-600">Email: {user?.email}</p>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Balance Card */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-pink-600 mb-4">Balance Overview</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Earnings</span>
                <span className="text-green-600 font-semibold">${ownerData?.totalEarnings?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Payments</span>
                <span className="text-orange-600 font-semibold">${ownerData?.pendingPayments?.toFixed(2) || '0.00'}</span>
              </div>
              {ownerData?.lastPaymentUpdate && (
                <p className="text-sm text-gray-500 mt-2">
                  Last updated: {new Date(ownerData.lastPaymentUpdate.toDate()).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Activities Card */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-pink-600 mb-4">Recent Activities</h2>
            <div className="space-y-3">
              {activities.map(activity => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'booking' ? 'bg-green-500' :
                    activity.type === 'payment' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`}></div>
                  <div>
                    <p className="text-sm text-gray-800">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp.toDate()).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-gray-500 text-sm">No recent activities</p>
              )}
            </div>
          </div>

          {/* Notifications Card */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-pink-600 mb-4">Notifications</h2>
            <div className="space-y-3">
              {notifications.map(notification => (
                <div key={notification.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    notification.priority === 'high' ? 'bg-red-500' :
                    notification.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  <div>
                    <p className="text-sm text-gray-800">{notification.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(notification.timestamp.toDate()).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-gray-500 text-sm">No new notifications</p>
              )}
            </div>
          </div>
        </div>

        {/* Active Buses */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-pink-600 mb-4">Active Buses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBuses.map(bus => (
              <div key={bus.id} className="bg-white p-4 rounded-lg shadow">
                <p className="font-semibold">{bus.licensePlate}</p>
                <p>Driver: {bus.driverName}</p>
                <p>Route: {bus.currentRoute}</p>
                <p>Available Seats: {bus.availableSeats}</p>
              </div>
            ))}
            {activeBuses.length === 0 && <p className="text-gray-600">No active buses</p>}
          </div>
        </div>

        {/* All Buses */}
        <div>
          <h2 className="text-2xl font-semibold text-pink-600 mb-4">Your Buses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {buses.map(bus => (
              <div key={bus.id} className="bg-white p-4 rounded-lg shadow">
                <p className="font-semibold">{bus.licensePlate}</p>
                <p>Type: {bus.type}</p>
                <p>Capacity: {bus.capacity} seats</p>
              </div>
            ))}
            {buses.length === 0 && <p className="text-gray-600">No buses registered</p>}
          </div>
        </div>

        {error && <div className="mt-4 p-4 bg-red-50 text-red-600 rounded">{error}</div>}
      </div>
    </div>
  );
};

export default OwnerHome;