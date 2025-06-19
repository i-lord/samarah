# Samarah

Samarah is a modern web application for bus owners, drivers, and clients to manage and book bus rides efficiently. It provides role-based authentication, real-time bus assignment, and a user-friendly interface for all account types.

## Features

- Role-based authentication (Owner, Driver, Client)
- Google sign-in for clients
- Profile management for each user type
- Real-time bus assignment and tracking
- Dark mode support
- Responsive design
- Deployed on Vercel

## Technologies Used

- React
- Firebase (Authentication, Firestore)
- Tailwind CSS
- Vercel (Deployment)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/samarah.git
cd samarah
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory and add your Firebase configuration:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Run the app locally

```bash
npm run dev
```

### 5. Deploy

This project is ready to deploy on [Vercel](https://vercel.com/). Simply connect your repository and set the environment variables in the Vercel dashboard.

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please contact [samarah.support@email.com](mailto:samarah.support@email.com).

<!--
## Screenshots

Add screenshots here in the future.
-->
