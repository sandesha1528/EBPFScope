import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import { Dashboard } from './pages/Dashboard';
import { Processes } from './pages/Processes';
import { Files } from './pages/Files';
import { Network } from './pages/Network';
import { Alerts } from './pages/Alerts';
import './index.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/processes", element: <Processes /> },
      { path: "/files", element: <Files /> },
      { path: "/network", element: <Network /> },
      { path: "/alerts", element: <Alerts /> },
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
