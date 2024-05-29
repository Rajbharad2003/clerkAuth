import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { SignIn, SignUp } from "@clerk/clerk-react";

const App = () => {
  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />}>
          <Route index element={<HomePage />} />
        </Route>
        <Route path="/login" element={<SignIn />}>
          <Route index element={<SignIn />} />
        </Route>
        <Route path="/sign-up" element={<SignUp />}>
          <Route index element={<SignUp />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </>
  );
};

export default App;
