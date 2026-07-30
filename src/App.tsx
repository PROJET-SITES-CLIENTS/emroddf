import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import ProductDetail from "./pages/ProductDetail";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import Layout from "./components/layout/Layout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="a-propos" element={<About />} />
          <Route path="services" element={<Services />} />
          <Route path="catalogue/:categorySlug/:modelSlug" element={<ProductDetail />} />
          <Route path="galerie" element={<Gallery />} />
          <Route path="contact" element={<Contact />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
