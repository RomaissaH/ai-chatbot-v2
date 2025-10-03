import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const LandingLayout = () => {
  return (
    <main className="w-full min-h-screen flex flex-col">
      <Navbar />
      <Outlet />
    </main>
  );
};

export default LandingLayout;
