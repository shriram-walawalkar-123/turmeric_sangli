// import React, { useState, useEffect } from 'react';
// import { CheckCircle, Package, TrendingUp, Activity } from 'lucide-react';
// import { STAGES } from '../utils/constants';
// import { API } from '../config/api';

const Dashboard = () => {
  // const [stats, setStats] = useState([]);
  // const [recentActivity, setRecentActivity] = useState([]);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   fetchDashboardData();
  // }, []);

  // const fetchDashboardData = async () => {
  //  try {
  //     const [statsRes, activityRes] = await Promise.all([
  //       API.getStats(),
  //       API.getRecentActivity()
  //     ]);
      
  //     setStats(statsRes.data);
  //     setRecentActivity(activityRes.data);
  //   } catch (error) {
  //     console.error('Error fetching dashboard data:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center h-64">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
  //     </div>
  //   );
  // }

  return (
    <div></div>
    // <div className="space-y-6">
    //   {/* Stats Grid */}
    //   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    //     {STAGES.map((stage, idx) => (
    //       <div 
    //         key={stage.id} 
    //         className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-200"
    //       >
    //         <div className="flex items-center justify-between mb-3">
    //           <h3 className="font-semibold text-gray-800 text-lg">{stage.name}</h3>
    //           <CheckCircle className="text-green-500" size={24} />
    //         </div>
    //         <p className="text-3xl font-bold text-gray-900 mb-1">
    //           {stats[idx]?.count || (idx * 45 + 23)}
    //         </p>
    //         <div className="flex items-center gap-2 text-sm text-gray-500">
    //           <TrendingUp size={16} className="text-green-500" />
    //           <span>Total Records</span>
    //         </div>
    //       </div>
    //     ))}
    //   </div>

    //   {/* Recent Activity */}
    //   <div className="bg-white rounded-lg shadow-lg p-6">
    //     <div className="flex items-center gap-2 mb-4">
    //       <Activity className="text-green-600" size={24} />
    //       <h3 className="font-semibold text-lg text-gray-800">Recent Activity</h3>
    //     </div>
    //     <div className="space-y-3">
    //       {recentActivity.length > 0 ? (
    //         recentActivity.map(activity => (
    //           <div 
    //             key={activity.id} 
    //             className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
    //           >
    //             <div className="flex items-center gap-3">
    //               <div className="bg-green-100 p-2 rounded-lg">
    //                 <Package className="text-green-600" size={20} />
    //               </div>
    //               <div>
    //                 <p className="font-medium text-sm text-gray-800">
    //                   Batch {activity.batch_id}
    //                 </p>
    //                 <p className="text-xs text-gray-500">
    //                   {activity.stage} • {activity.time}
    //                 </p>
    //               </div>
    //             </div>
    //             <span className={`px-3 py-1 rounded-full text-xs font-medium ${
    //               activity.status === 'Active' 
    //                 ? 'bg-green-100 text-green-800' 
    //                 : 'bg-blue-100 text-blue-800'
    //             }`}>
    //               {activity.status}
    //             </span>
    //           </div>
    //         ))
    //       ) : (
    //         <p className="text-center text-gray-500 py-8">No recent activity</p>
    //       )}
    //     </div>
    //   </div>

    //   {/* Quick Stats */}
    //   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    //     <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
    //       <p className="text-sm opacity-90 mb-2">Total Batches</p>
    //       <p className="text-4xl font-bold">247</p>
    //     </div>
    //     <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
    //       <p className="text-sm opacity-90 mb-2">Active Shipments</p>
    //       <p className="text-4xl font-bold">38</p>
    //     </div>
    //     <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
    //       <p className="text-sm opacity-90 mb-2">Completed Today</p>
    //       <p className="text-4xl font-bold">12</p>
    //     </div>
    //   </div>
    // </div>
  );
};

export default Dashboard;