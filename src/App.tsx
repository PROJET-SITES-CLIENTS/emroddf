import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import Layout from "./components/layout/Layout";
import { fetchCatalogue } from "./lib/api";

// Code Splitting (Lazy Loading)
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Contact = lazy(() => import("./pages/Contact"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));

function PageLoader() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="w-8 h-8 rounded-sm border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
}

export default function App() {
  // Pre-fetch catalogue data in background to make navigation instantaneous
  useEffect(() => {
    fetchCatalogue().catch(console.error);
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="a-propos" element={<About />} />
            <Route path="services" element={<Services />} />
            <Route path="catalogue/:categorySlug/:modelSlug" element={<ProductDetail />} />
            <Route path="galerie" element={<Gallery />} />
            <Route path="contact" element={<Contact />} />
            <Route path="payment/success" element={<PaymentSuccess />} />
            <Route path="payment/cancel" element={<PaymentCancel />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
