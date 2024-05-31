import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import MainHome from "./components/Home/MainHome";
import CapturedImagePage from "./components/Home/CapturedImagePage";
import './App.css';  // Ensure you create this file for transition styles


const App = () => {
  const [capturedImage, setCapturedImage] = useState("");

  return (
      <Router>
          <TransitionGroup>
              <Routes>
                  <Route 
                      path="/" 
                      element={
                          <CSSTransition timeout={300} classNames="page">
                              <MainHome setCapturedImage={setCapturedImage} />
                          </CSSTransition>
                      } 
                  />
                  <Route 
                      path="/captured" 
                      element={
                          <CSSTransition timeout={300} classNames="page">
                              <CapturedImagePage capturedImage={capturedImage} />
                          </CSSTransition>
                      } 
                  />
              </Routes>
          </TransitionGroup>
      </Router>
  );
};

export default App;