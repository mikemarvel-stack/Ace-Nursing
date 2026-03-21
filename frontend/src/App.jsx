import { Outlet, useLocation } from 'react-router-dom';
import Header from './components/Header';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProductCategoryMenu from './components/ProductCategoryMenu';

const App = () => {
  const location = useLocation();
  // The homepage can have paths like '/', '/search/:keyword', or '/page/:pageNumber'
  // We check if the pathname matches the base homepage structure.
  const isHomePage =
    location.pathname === '/' ||
    location.pathname.startsWith('/search') ||
    location.pathname.startsWith('/page');

  return (
    <>
      <ToastContainer />
      <Header />
      <main className='py-3'>
        <div className='container mx-auto px-4'>
          <div className='flex'>
            {!isHomePage && <ProductCategoryMenu />}
            <div className='flex-1'>
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default App;